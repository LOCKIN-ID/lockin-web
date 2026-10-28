import { existsSync, statSync, createReadStream } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";

import { currentUser } from "@/lib/auth";
import { getBook } from "@/content/books";
import { bookPrice } from "@/content/plans";
import { accessFor, canOpen } from "@/lib/entitlements";
import { parseByteRange } from "@/lib/storage/range";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const book = getBook(slug);
  if (!book) {
    return new Response(JSON.stringify({ error: "book_not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = await currentUser();
  const userId = session?.user?.id;
  const access = await accessFor(userId);
  const isAllowed = canOpen(access, { slug: book.slug, priceIdr: bookPrice(book.slug) });

  if (!isAllowed) {
    if (!session) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Find PDF file on disk
  const publicPdf = join(process.cwd(), "public", "ebooks", `${slug}.pdf`);
  const storagePdf = join(process.cwd(), "storage", "ebooks", `${slug}.pdf`);

  let filePath: string | null = null;
  if (existsSync(publicPdf)) {
    filePath = publicPdf;
  } else if (existsSync(storagePdf)) {
    filePath = storagePdf;
  }

  if (!filePath) {
    return new Response(JSON.stringify({ error: "pdf_not_generated" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stat = statSync(filePath);
  const fileSize = stat.size;

  const rangeHeader = request.headers.get("range");
  const parsed = parseByteRange(rangeHeader, fileSize);

  if (parsed === "unsatisfiable") {
    return new Response(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${fileSize}`,
      },
    });
  }

  if (parsed) {
    const { start, end } = parsed;
    const chunkSize = end - start + 1;
    const stream = createReadStream(filePath, { start, end });
    const webStream = Readable.toWeb(stream) as ReadableStream;

    return new Response(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${slug}.pdf"`,
      },
    });
  }

  // Full response
  const stream = createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new Response(webStream, {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(fileSize),
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slug}.pdf"`,
    },
  });
}
