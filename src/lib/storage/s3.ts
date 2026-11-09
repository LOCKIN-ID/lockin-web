import { AwsClient } from "aws4fetch";

import { assertSafeKey, type Storage } from "./index";

/**
 * The hosted driver: any S3-compatible endpoint, signed with SigV4.
 *
 * Path-style addressing (`<endpoint>/<bucket>/<key>`) is what R2, MinIO and Supabase
 * accept, and it is the only style that works when the bucket name is not a DNS-safe
 * label, so it is the one this driver speaks.
 */
export class S3Storage implements Storage {
  readonly name = "s3" as const;

  private readonly client: AwsClient;
  private readonly base: string;

  constructor(
    endpoint = process.env.S3_ENDPOINT ?? "",
    bucket = process.env.S3_BUCKET ?? "",
    region = process.env.S3_REGION ?? "auto",
    accessKeyId = process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? "",
  ) {
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "STORAGE_DRIVER=s3 needs S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.",
      );
    }
    this.client = new AwsClient({
      accessKeyId,
      secretAccessKey,
      region,
      service: "s3",
    });
    this.base = `${endpoint.replace(/\/+$/, "")}/${bucket}`;
  }

  private url(key: string): string {
    return `${this.base}/${assertSafeKey(key).split("/").map(encodeURIComponent).join("/")}`;
  }

  async put(key: string, body: Uint8Array | string, contentType?: string): Promise<void> {
    // `fetch` wants `BodyInit`; a `Uint8Array` is one at runtime, and the byte view's
    // buffer type only differs by which backing store it came from.
    const payload = body as unknown as BodyInit;
    const response = await this.client.fetch(this.url(key), {
      method: "PUT",
      body: payload,
      headers: contentType ? { "content-type": contentType } : undefined,
    });
    if (!response.ok) {
      throw new Error(`storage: PUT ${key} failed with ${response.status} ${await response.text()}`);
    }
  }

  async read(key: string): Promise<Uint8Array | null> {
    const response = await this.client.fetch(this.url(key));
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`storage: GET ${key} failed with ${response.status}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  async stat(key: string): Promise<{ size: number } | null> {
    const response = await this.client.fetch(this.url(key), { method: "HEAD" });
    if (!response.ok) return null;
    const length = Number(response.headers.get("content-length") ?? "0");
    return { size: Number.isFinite(length) ? length : 0 };
  }

  async remove(key: string): Promise<void> {
    const response = await this.client.fetch(this.url(key), { method: "DELETE" });
    if (!response.ok && response.status !== 404) {
      throw new Error(`storage: DELETE ${key} failed with ${response.status}`);
    }
  }
}
