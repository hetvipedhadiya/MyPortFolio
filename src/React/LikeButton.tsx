import React, { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";

const LikeButton = () => {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const storedIsLiked = localStorage.getItem("websiteIsLiked");
    if (storedIsLiked) {
      setIsLiked(storedIsLiked === "true");
    }

    // Listen for realtime updates from Firestore if available
    try {
      const likeDocRef = doc(db, "likes", "counter");
      const unsubscribe = onSnapshot(likeDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const currentLikes = docSnap.data().likes;
          setLikes(Math.max(0, currentLikes));
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.log("Firestore offline/disabled, using local state");
    }
  }, []);

  const handleLike = async () => {
    if (isProcessing) return;

    if (isLiked) {
      // Unlike
      setIsLiked(false);
      setLikes((prev) => Math.max(0, prev - 1));
      localStorage.setItem("websiteIsLiked", "false");
      try {
        const likeDocRef = doc(db, "likes", "counter");
        await updateDoc(likeDocRef, { likes: increment(-1) });
      } catch (e) {}
    } else {
      // Like
      setIsLiked(true);
      setLikes((prev) => prev + 1);
      setIsAnimating(true);
      localStorage.setItem("websiteIsLiked", "true");
      setTimeout(() => setIsAnimating(false), 500);

      try {
        setIsProcessing(true);
        const likeDocRef = doc(db, "likes", "counter");
        await updateDoc(likeDocRef, { likes: increment(1) });
      } catch (error) {
        console.error("Error updating likes:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (!isClient) return null;

  return (
    <div className="flex items-center">
      <button
        onClick={handleLike}
        disabled={isProcessing}
        className={`
          group relative w-40 h-10 flex items-center justify-center p-3
          rounded-full transition-all duration-300 ease-in-out transform border-2 cursor-pointer
          ${
            isLiked
              ? "border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105"
              : "border-[var(--white-icon-tr)] hover:border-red-500 hover:text-red-500 text-[var(--white-icon)]"
          }
          ${isAnimating ? "scale-110" : ""}
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isLiked ? "#ef4444" : "currentColor"}
          className={`w-6 h-6 transition-all duration-300 ease-in-out 
            ${isLiked ? "text-red-500 scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-[var(--white-icon)] group-hover:text-red-500 group-hover:scale-110"}
          `}
        >
          {isLiked ? (
            /* Filled Red Heart Icon */
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          ) : (
            /* Outline Heart Icon */
            <path d="M16.5 3C19.5376 3 22 5.5 22 9C22 16 14.5 20 12 21.5C9.5 20 2 16 2 9C2 5.5 4.5 3 7.5 3C9.35997 3 11 4 12 5C13 4 14.64 3 16.5 3ZM12.9339 18.6038C13.8155 18.0485 14.61 17.4955 15.3549 16.9029C18.3337 14.533 20 11.9435 20 9C20 6.64076 18.463 5 16.5 5C15.4241 5 14.2593 5.56911 13.4142 6.41421L12 7.82843L10.5858 6.41421C9.74068 5.56911 8.5759 5 7.5 5C5.55906 5 4 6.6565 4 9C4 11.9435 5.66627 14.533 8.64514 16.9029C9.39 17.4955 10.1845 18.0485 11.0661 18.6038C11.3646 18.7919 11.6611 18.9729 12 19.1752C12.3389 18.9729 12.6354 18.7919 12.9339 18.6038Z" />
          )}
        </svg>
        <span className={`text-sm pl-3 font-semibold ${isLiked ? "text-red-500" : "text-[var(--white)]"}`}>
          {likes} Likes
        </span>
      </button>
    </div>
  );
};

export default LikeButton;
