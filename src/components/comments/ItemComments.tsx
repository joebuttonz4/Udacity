'use client';

// Comments — THIS_IS_THE_APP.md screen 4, built to
// mockup/civicmarket_mockup.jsx (`Comments`) in Civic Navy v3.
//
// Self-contained: loads and errors on its own so item detail never blocks on
// the thread.
//
// Deliberately absent: helpful/not-helpful voting and the helpful/newest sort
// (the sort is meaningless without votes, so both wait for screen 5), the AI
// summary, level and act badges, affected-area weighting, penalties, the
// 3-flag auto-hide, threaded replies, edit/delete, per-comment reporting,
// candidate comments.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getComments,
  getCommenterProfile,
  postComment,
  saveDisplayName,
  setCommentHidden,
  postErrorMessage,
  formatCommentDate,
  BODY_MAX,
  BODY_MIN,
  BODY_COUNTER_FROM,
  NAME_MAX,
  NAME_MIN,
  type Comment,
  type CommenterProfile,
} from '@/lib/comments';
import { Card, SectionLabel } from '@/components/navy';

function CommentCard({
  comment,
  currentUserId,
  isAdmin,
  onToggleHidden,
  busy,
}: {
  comment: Comment;
  currentUserId: string;
  isAdmin: boolean;
  onToggleHidden: (c: Comment) => void;
  busy: boolean;
}) {
  const mine = comment.user_id === currentUserId;
  const hidden = !!comment.hidden_at;

  return (
    <Card className={hidden ? 'opacity-60' : ''}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[14px] font-semibold text-[#1B2B41] [font-family:var(--font-instrument-sans)]">
          {comment.author_name}
        </span>
        {mine && (
          <span className="inline-flex items-center h-5 px-2 rounded-full bg-[#0E2A47] text-white text-[10px] font-semibold [font-family:var(--font-instrument-sans)]">
            You
          </span>
        )}
        <span className="text-[12px] text-[#8A99AD] ml-auto [font-family:var(--font-instrument-sans)]">
          {formatCommentDate(comment.created_at)}
        </span>
      </div>

      <p className="text-[15px] text-[#1B2B41] leading-6 mt-2 whitespace-pre-line [font-family:var(--font-instrument-sans)]">
        {comment.body}
      </p>

      {hidden && (
        <p className="text-[12px] font-semibold text-[#8A99AD] mt-2 [font-family:var(--font-instrument-sans)]">
          Hidden — only you can see this
        </p>
      )}

      {/* Moderation is post-publication and reversible. The column grant on
          UPDATE means this can set the hide fields and nothing else. */}
      {isAdmin && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggleHidden(comment)}
          className="text-[12px] font-semibold text-[#5A6B82] underline mt-2.5 disabled:opacity-40 [font-family:var(--font-instrument-sans)]"
        >
          {hidden ? 'Unhide' : 'Hide this comment'}
        </button>
      )}
    </Card>
  );
}

function Composer({
  profile,
  onPost,
  posting,
  error,
}: {
  profile: CommenterProfile;
  /** Resolves true only when the row is committed, which is the signal to
   *  clear the draft. A failed post never loses what someone wrote. */
  onPost: (name: string, body: string) => Promise<boolean>;
  posting: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(profile.displayName ?? '');
  const [body, setBody] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const needsName = !profile.displayName;
  const trimmedBody = body.trim();
  const trimmedName = name.trim();

  if (!profile.onboarded) {
    return (
      <Card>
        <SectionLabel>Add your take</SectionLabel>
        <p className="text-[15px] text-[#5A6B82] leading-6 mt-2 [font-family:var(--font-instrument-sans)]">
          Finish setting up your account to comment.
        </p>
        <Link
          href="/onboarding/issues"
          className="flex items-center justify-center w-full h-12 rounded-[10px] bg-[#0E2A47] text-white font-semibold text-[15px] mt-4 active:scale-[0.98] transition-transform [font-family:var(--font-instrument-sans)]"
        >
          Finish setting up
        </Link>
      </Card>
    );
  }

  async function submit() {
    setLocalError(null);

    if (needsName && (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX)) {
      setLocalError(`Your name needs to be ${NAME_MIN} to ${NAME_MAX} characters.`);
      return;
    }
    if (trimmedBody.length < BODY_MIN) {
      setLocalError('Write something first.');
      return;
    }
    if (trimmedBody.length > BODY_MAX) {
      setLocalError(`Keep it under ${BODY_MAX} characters.`);
      return;
    }

    const ok = await onPost(trimmedName, trimmedBody);
    if (ok) setBody('');
  }

  const shown = localError ?? error;

  return (
    <Card>
      <SectionLabel>Add your take</SectionLabel>

      {needsName ? (
        <div className="mt-3">
          <label
            htmlFor="comment-name"
            className="text-[13px] font-semibold text-[#1B2B41] [font-family:var(--font-instrument-sans)]"
          >
            How should neighbors see your name?
          </label>
          <input
            id="comment-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setLocalError(null);
            }}
            maxLength={NAME_MAX}
            placeholder="Rosa M."
            autoCapitalize="words"
            autoCorrect="off"
            className="h-12 w-full rounded-[10px] border border-[#E4E9F0] px-4 text-[15px] text-[#1B2B41] placeholder-[#8A99AD] bg-white mt-2 focus:outline-none focus:border-[#0E2A47] transition-colors [font-family:var(--font-instrument-sans)]"
          />
          <p className="text-[12px] text-[#5A6B82] leading-5 mt-1.5 [font-family:var(--font-instrument-sans)]">
            First name and last initial works well, like Rosa M.{' '}
            <span className="font-semibold text-[#1B2B41]">
              This name is shown publicly on every comment you post, to all other beta
              participants.
            </span>{' '}
            You can change it later in your profile.
          </p>
        </div>
      ) : (
        <p className="text-[13px] text-[#5A6B82] mt-2 [font-family:var(--font-instrument-sans)]">
          Posting publicly as{' '}
          <span className="font-semibold text-[#1B2B41]">{profile.displayName}</span>
        </p>
      )}

      <textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setLocalError(null);
        }}
        rows={3}
        maxLength={BODY_MAX}
        placeholder="What do you know about this that your neighbors don't?"
        className="w-full box-border rounded-[10px] border border-[#E4E9F0] p-3 text-[15px] text-[#1B2B41] placeholder-[#8A99AD] bg-white mt-3 resize-none focus:outline-none focus:border-[#0E2A47] transition-colors [font-family:var(--font-instrument-sans)]"
      />

      {trimmedBody.length >= BODY_COUNTER_FROM && (
        <p className="text-[12px] text-[#8A99AD] text-right [font-family:var(--font-instrument-sans)]">
          {trimmedBody.length} / {BODY_MAX}
        </p>
      )}

      {shown && (
        <p className="text-[13px] text-[#E5484D] leading-5 mt-2 [font-family:var(--font-instrument-sans)]">
          {shown}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={posting}
        className="w-full h-12 rounded-[10px] bg-[#0E2A47] text-white font-semibold text-[15px] mt-3 disabled:opacity-40 active:scale-[0.98] transition-transform [font-family:var(--font-instrument-sans)]"
      >
        {posting ? 'Posting…' : 'Post comment'}
      </button>
    </Card>
  );
}

export default function ItemComments({
  itemId,
  userId,
}: {
  itemId: string;
  userId: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [profile, setProfile] = useState<CommenterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [hidingId, setHidingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const [list, prof] = await Promise.all([
          getComments(itemId),
          getCommenterProfile(userId),
        ]);
        if (cancelled) return;
        setComments(list);
        setProfile(prof);
      } catch (err: unknown) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Something went wrong loading comments.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [itemId, userId, reloadKey]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }

  async function handlePost(name: string, body: string): Promise<boolean> {
    if (!profile) return false;
    setPosting(true);
    setPostError(null);

    try {
      // Saved before the insert so a rejected comment still leaves the name
      // set, rather than asking for it again on the retry.
      if (!profile.displayName) {
        await saveDisplayName(userId, name);
        setProfile({ ...profile, displayName: name.trim() });
      }

      const created = await postComment({
        itemId,
        userId,
        authorName: profile.displayName ?? name,
        body,
      });

      setComments((prev) => [created, ...prev]);
      return true;
    } catch (err: unknown) {
      setPostError(postErrorMessage(err));
      return false;
    } finally {
      setPosting(false);
    }
  }

  async function handleToggleHidden(comment: Comment) {
    setHidingId(comment.id);
    const hide = !comment.hidden_at;
    try {
      await setCommentHidden(comment.id, userId, hide);
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? { ...c, hidden_at: hide ? new Date().toISOString() : null }
            : c,
        ),
      );
    } catch {
      setLoadError('Could not change that comment. Try again.');
    } finally {
      setHidingId(null);
    }
  }

  const visibleCount = comments.filter((c) => !c.hidden_at).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="pt-3">
        <SectionLabel>
          {loading
            ? 'Neighbors'
            : `Neighbors · ${visibleCount} comment${visibleCount === 1 ? '' : 's'}`}
        </SectionLabel>
      </div>

      {loading && (
        <Card className="animate-pulse">
          <div className="h-3 w-28 bg-[#E4E9F0] rounded" />
          <div className="h-3 w-full bg-[#F5F7FA] rounded mt-3" />
          <div className="h-3 w-2/3 bg-[#F5F7FA] rounded mt-2" />
        </Card>
      )}

      {!loading && loadError && (
        <Card className="border-[#E5484D]">
          <p className="text-[14px] font-semibold text-[#1B2B41] [font-family:var(--font-instrument-sans)]">
            We couldn&apos;t load comments
          </p>
          <p className="text-[13px] text-[#5A6B82] leading-5 mt-1.5 [font-family:var(--font-instrument-sans)]">
            {loadError}
          </p>
          <button
            type="button"
            onClick={retry}
            className="w-full h-12 rounded-[10px] bg-[#0E2A47] text-white font-semibold text-[15px] mt-4 active:scale-[0.98] transition-transform [font-family:var(--font-instrument-sans)]"
          >
            Try again
          </button>
        </Card>
      )}

      {!loading && !loadError && profile && (
        <>
          <Composer
            profile={profile}
            onPost={handlePost}
            posting={posting}
            error={postError}
          />

          {comments.length === 0 ? (
            <Card>
              <p className="text-[16px] font-semibold text-[#1B2B41] [font-family:var(--font-instrument-sans)]">
                No comments yet
              </p>
              <p className="text-[15px] text-[#5A6B82] leading-6 mt-2 [font-family:var(--font-instrument-sans)]">
                Be the first. What do you know about this that your neighbors don&apos;t?
              </p>
            </Card>
          ) : (
            comments.map((c) => (
              <CommentCard
                key={c.id}
                comment={c}
                currentUserId={userId}
                isAdmin={profile.isAdmin}
                onToggleHidden={handleToggleHidden}
                busy={hidingId === c.id}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}
