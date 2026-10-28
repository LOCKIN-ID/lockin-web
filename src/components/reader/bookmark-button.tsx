"use client";

import { useState } from "react";
import { toggleBookmark } from "@/app/(app)/app/books/[slug]/actions";

interface Props {
  bookSlug: string;
  chapterId: string;
  sectionId: string;
  initialBookmarked: boolean;
  label?: string;
}

export function BookmarkButton({ bookSlug, chapterId, sectionId, initialBookmarked }: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, setPending] = useState(false);

  const handleToggle = async () => {
    if (pending) return;
    setPending(true);
    try {
      const res = await toggleBookmark({ bookSlug, chapterId, sectionId });
      if (res.ok) {
        setBookmarked(res.bookmarked);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      className="btn btn--quiet btn--sm"
      onClick={handleToggle}
      disabled={pending}
      title={bookmarked ? "Remove bookmark" : "Bookmark this section"}
      style={{ padding: "0 var(--space-sm)", minHeight: "32px", height: "32px" }}
    >
      <span aria-hidden="true">{bookmarked ? "★" : "☆"}</span>
      <span>{bookmarked ? "Bookmarked" : "Bookmark"}</span>
    </button>
  );
}
