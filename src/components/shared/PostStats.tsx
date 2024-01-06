import {
  useDeleteSavePost,
  useGetCurrentUser,
  useLikePost,
  useSavePost,
} from "@/lib/react-query/queries";
import { checkIsLiked } from "@/lib/utils";
import { Models } from "appwrite";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Loader from "./Loader";

type PostStatsProps = {
  post: Models.Document;
  userId: string;
};

const PostStats = ({ post, userId }: PostStatsProps) => {
  const location = useLocation();
  const likesList = post?.likes.map((user: Models.Document) => user.$id);
  const [likes, setLikes] = useState<string[]>(likesList);
  const [isSaved, setIsSaved] = useState(false);
  //query
  const { mutate: likePost, isPending: isLikeLoading } = useLikePost();
  const { mutate: savePost, isPending: isSaveLoading } = useSavePost();
  const { mutate: deleteSavePost, isPending: isDeleteLoading } =
    useDeleteSavePost();

  const { data: currentUser } = useGetCurrentUser();
  // console.log(currentUser)
  const savedPost = currentUser?.saves.find(
    (save: Models.Document) => save.post.$id === post?.$id,
  );

  useEffect(() => {
    setIsSaved(!!savedPost);
  }, [currentUser]);

  const handleLikePost = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>,
  ) => {
    e.stopPropagation();

    let likesArray = [...likes];
    if (likesArray.includes(userId)) {
      likesArray = likesArray.filter((id: string) => id !== userId);
    } else {
      likesArray.push(userId);
    }
    setLikes(likesArray);
    likePost({ postId: post.$id, likesArray });
  };

  const handleSavePost = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>,
  ) => {
    e.stopPropagation();
    if (isSaved) {
      deleteSavePost(savedPost.$id);
      setIsSaved(false);
    } else {
      savePost({ userId, postId: post.$id });
      setIsSaved(true);
    }
  };

  const containerStyles = location.pathname.startsWith("/profile")
    ? "w-full"
    : "";
  return (
    <div
      className={`flex justify-between items-center z-20 ${containerStyles}`}
    >
      <div className="flex gap-2 mr-5">
        {isLikeLoading ? (
          <Loader />
        ) : (
          <img
            src={
              checkIsLiked(likes, userId)
                ? `/assets/icons/liked.svg`
                : `/assets/icons/like.svg`
            }
            alt="like"
            width={20}
            height={20}
            onClick={(e) => handleLikePost(e)}
          />
        )}
        <p className="small-medium lg:base-medium">{likes.length}</p>
      </div>

      <div className="flex gap-2">
        {isSaveLoading || isDeleteLoading ? (
          <Loader />
        ) : (
          <img
            src={isSaved ? "/assets/icons/saved.svg" : "/assets/icons/save.svg"}
            alt="comment"
            width={20}
            height={20}
            onClick={(e) => handleSavePost(e)}
          />
        )}

        {/* <p className="small-medium lg:base-medium">{post.saves.length}</p> */}
      </div>
    </div>
  );
};

export default PostStats;
