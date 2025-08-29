import React from "react";

interface PostCardProps {
  title: string;
  description: string;
  imageUrl: string;
  onBook: () => void;
  buttonLabel: string;
  onDelete?: () => void;
  onRespond?: () => void;
  showActions?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  title,
  description,
  imageUrl,
  onBook,
  buttonLabel,
  onDelete,
  onRespond,
  showActions = false,
}) => (
  <div className="bg-white shadow rounded-lg overflow-hidden relative">
   <img
  src={imageUrl}
  alt={title}
  className="w-full h-60 object-contain  bg-gray-100"
/>
    <div className="p-4">
      <h4 className="font-bold text-lg mb-1">{title}</h4>
      <p className="text-gray-600 mb-3">{description}</p>
      
      {showActions && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={onRespond}
            className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded text-sm flex-1"
            type="button"
          >
            Respond
          </button>
          <button
            onClick={onDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex-1"
            type="button"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  </div>
);

export const NoPostsCard: React.FC = () => (
  <div className="rounded-lg w-full p-6 flex items-center text-gray-500">
    No posts yet.
  </div>
);

export default PostCard;