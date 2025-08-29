import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supa/supabaseclient";
import { Loader2, ArrowLeft, Mail, Calendar, User } from "lucide-react";
import { toast } from "react-hot-toast";

const PostDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();
      setLoading(false);
      if (error) {
        toast.error("Could not load post");
        navigate(-1);
        return;
      }
      setPost(data);

      // Fetch user name if user_id exists
      if (data?.user_id) {
        const { data: userData } = await supabase
          .from("users")
          .select("name")
          .eq("id", data.user_id)
          .single();
        if (userData && userData.name) setUserName(userData.name);
        else setUserName("");
      } else {
        setUserName("");
      }

      setImgIdx(0);
    };
    fetchPost();
  }, [id, navigate]);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        const { data } = await supabase
          .from("users")
          .select("id")
          .eq("email", user.email)
          .single();
        if (data && data.id) {
          setUserId(data.id);
        }
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    // Check if user already applied for this book
    const checkApplied = async () => {
      if (!userId || !post) return;
      if (userId === post.user_id) return; // Owner shouldn't apply
      const { data } = await supabase
        .from("applied_books")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", userId)
        .single();
      setApplied(!!data);
    };
    checkApplied();
  }, [userId, post]);

  // "Apply for this Book" logic (same as Home page)
  const handleApply = async () => {
    if (!userId || !post) {
      toast.error("User not found or post not loaded.");
      return;
    }
    if (userId === post.user_id) {
      toast.error("You cannot apply to your own book.");
      return;
    }

    setApplyLoading(true);

    // Get applicant profile
    const { data: applicantProfile } = await supabase
      .from("users")
      .select("id, name")
      .eq("id", userId)
      .single();
    if (!applicantProfile) {
      toast.error("Your profile not found.");
      setApplyLoading(false);
      return;
    }

    // Get post owner profile
    const { data: ownerProfile } = await supabase
      .from("users")
      .select("name")
      .eq("id", post.user_id)
      .single();
    if (!ownerProfile) {
      toast.error("Post owner not found.");
      setApplyLoading(false);
      return;
    }

    // Check if already applied (should not happen, but just in case)
    const { data: existing } = await supabase
      .from("applied_books")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", applicantProfile.id)
      .single();
    if (existing) {
      toast.error("You already applied for this book.");
      setApplyLoading(false);
      setApplied(true);
      return;
    }

    // Insert application
    const { error } = await supabase
      .from("applied_books")
      .insert([{
        post_id: post.id,
        user_id: applicantProfile.id,
        applied_at: new Date().toISOString(),
        status: "pending",
        userapplied_name: applicantProfile.name,
        owner_name: ownerProfile.name,
      }]);
    setApplyLoading(false);
    if (error) {
      toast.error("Failed to apply: " + error.message);
    } else {
      toast.success("Request sent!");
      setApplied(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="animate-spin w-10 h-10 text-violet-600" />
      </div>
    );
  }
  if (!post) return null;

  const images: string[] = Array.isArray(post.images) ? post.images : [];
  const hasImages = images.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-6 bg-white rounded-xl shadow-lg mt-5">
      <button
        className="flex items-center text-violet-600 font-semibold mb-4 hover:underline"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> Back
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Image Gallery */}
        <div className="flex-shrink-0 w-full md:w-80">
          <div className="relative rounded-xl overflow-hidden border h-72 flex items-center justify-center bg-gray-100">
            {hasImages ? (
              <img
                src={images[imgIdx]}
                alt={`Book image ${imgIdx + 1}`}
                className="object-contain h-full w-full"
              />
            ) : (
              <span className="text-gray-400 text-lg">No image</span>
            )}
            {hasImages && images.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full shadow p-1"
                  onClick={() => setImgIdx((imgIdx - 1 + images.length) % images.length)}
                  aria-label="Previous image"
                >
                  {"<"}
                </button>
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-full shadow p-1"
                  onClick={() => setImgIdx((imgIdx + 1) % images.length)}
                  aria-label="Next image"
                >
                  {">"}
                </button>
              </>
            )}
          </div>
          {/* Thumbnails for images */}
          {hasImages && images.length > 1 && (
            <div className="flex gap-2 mt-2 justify-center items-center">
              {images.map((img, i) => (
                <img
                  key={img + i}
                  src={img}
                  alt={`thumb-${i + 1}`}
                  className={`w-10 h-10 object-cover rounded border cursor-pointer ${
                    i === imgIdx
                      ? "border-violet-500 ring-2 ring-violet-400"
                      : "border-gray-300"
                  }`}
                  onClick={() => setImgIdx(i)}
                />
              ))}
            </div>
          )}
        </div>
        {/* Post Details */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold text-violet-700 mb-2 flex flex-wrap items-center gap-3">
              {post.title}
              <span className="text-xs text-gray-500 bg-violet-100 px-2 py-1 rounded">
                {post.subject}
              </span>
            </h1>
            <div className="mb-2">
              <span className="block text-sm font-semibold text-gray-600 mb-1">Post Description:</span>
              <p className="text-gray-700 break-words">
                {post.description ? post.description : <span className="italic text-gray-400">No description provided.</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 mb-6 text-gray-600 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Bought Year: <span className="font-medium">{post.bought_year || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> Seller Email: <span className="font-medium">{post.email}</span>
              </div>
              {userName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" /> User Name: <span className="font-medium">{userName}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              className={`bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded font-semibold flex-1 transition ${applied ? "opacity-70 cursor-not-allowed" : ""}`}
              onClick={handleApply}
              disabled={applyLoading || applied}
            >
              {applyLoading ? <Loader2 className="animate-spin w-5 h-5 inline mr-2" /> : null}
              {applied ? "Applied" : "Apply for this Book"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetails;
