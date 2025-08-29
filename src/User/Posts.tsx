import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import HomePostCard from "../Component/HomePostCard";
import { NoPostsCard } from "../Component/PostCards";
import { supabase } from "../../supa/Supabaseclient";
import { Loader2, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import SearchFilterBar from "../component/SearchFilterBar";

// --- Image resize utility ---
function resizeImage(file: File, size = 517): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    img.onerror = reject;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not get canvas context"));
      const minLen = Math.min(img.width, img.height);
      const sx = (img.width - minLen) / 2;
      const sy = (img.height - minLen) / 2;
      ctx.drawImage(img, sx, sy, minLen, minLen, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Image blob is null"));
        resolve(new File([blob], file.name, { type: file.type }));
      }, file.type);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadToCloudinary(file: File): Promise<string> {
  const resizedFile = await resizeImage(file, 517);
  const formData = new FormData();
  formData.append('file', resizedFile);
  formData.append('upload_preset', 'booknest');
  const res = await fetch(import.meta.env.VITE_CLOUDINARY_NAME, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || "Upload failed");
  return data.secure_url;
}

const initialPostForm = {
  title: "",
  subject: "",
  boughtYear: "",
  images: [] as File[],
  description: "",
};

const filterOptions = [
  { label: "City", value: "city" },
  { label: "Pin Code", value: "pincode" },
  { label: "Area", value: "area" }
];

const Home: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);
  const [authUserEmail, setAuthUserEmail] = useState<string>("");
  const [userProfile, setUserProfile] = useState<{city: string, pincode: string, area: string}>({city: "", pincode: "", area: ""});

  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [postForm, setPostForm] = useState(initialPostForm);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [searchValue, setSearchValue] = useState<string>("");
  const [filterBy, setFilterBy] = useState<string>("none");
  const [filterActive, setFilterActive] = useState<boolean>(false);

  // Track applied post ids for this user
  const [appliedPostIds, setAppliedPostIds] = useState<number[]>([]);
  // Track approved post ids (i.e. posts that have been given away)
  const [approvedPostIds, setApprovedPostIds] = useState<number[]>([]);

  const navigate = useNavigate();

  // Fetch auth user and profile on mount
  useEffect(() => {
    const fetchAuthAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setAuthUserEmail(user.email);
        const { data } = await supabase
          .from("users")
          .select("id,city,pincode,area")
          .eq("email", user.email)
          .single();
        if (data) {
          setUserProfile({
            city: data.city || "",
            pincode: data.pincode || "",
            area: data.area || ""
          });
          setUserId(data.id || null);
        }
      }
    };
    fetchAuthAndProfile();
  }, []);

  // Fetch all posts (join with users for filter fields and name)
  const fetchAllPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        users (
          name,
          pincode,
          city,
          area
        )
      `);
    setLoading(false);
    if (error) {
      toast.error("Error fetching posts: " + error.message);
    }
    if (data) {
      setAllPosts(data);
      setPosts(data);
    }
  };

  // Fetch user's applied book requests AND fetch all approved post ids
  const fetchAppliedAndApprovedPostIds = async (userId: number) => {
    // Posts applied by me
    const { data: applied } = await supabase
      .from("applied_books")
      .select("post_id")
      .eq("user_id", userId);
    if (applied && Array.isArray(applied)) {
      setAppliedPostIds(applied.map((r) => r.post_id));
    }
    // Approved posts (given away)
    const { data: approved } = await supabase
      .from("applied_books")
      .select("post_id")
      .eq("status", "approved");
    if (approved && Array.isArray(approved)) {
      setApprovedPostIds(approved.map((r) => r.post_id));
    }
  };

  useEffect(() => {
    fetchAllPosts();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAppliedAndApprovedPostIds(userId);
    }
  }, [userId]);

  // SEARCH & FILTER logic
  useEffect(() => {
    let filtered = [...allPosts];
    if (filterBy !== "none" && userProfile[filterBy]) {
      filtered = filtered.filter(
        post => post.users && post.users[filterBy] && post.users[filterBy].toLowerCase() === userProfile[filterBy].toLowerCase()
      );
      setFilterActive(true);
    } else {
      setFilterActive(false);
    }
    if (searchValue.trim()) {
      filtered = filtered.filter(
        post =>
          (post.title && post.title.toLowerCase().includes(searchValue.trim().toLowerCase())) ||
          (post.subject && post.subject.toLowerCase().includes(searchValue.trim().toLowerCase()))
      );
    }
    setPosts(filtered);
  }, [filterBy, userProfile, searchValue, allPosts]);

  const onClearFilter = () => {
    setFilterBy("none");
  };

  const handlePostChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPostForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && postForm.images.length < 3) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostForm((prev) => ({
          ...prev,
          images: [...prev.images, file],
        }));
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleRemoveImage = (idx: number) => {
    setPostForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("User not found, please save your profile first.");
      return;
    }
    setPostLoading(true);

    let imageUrls: string[] = [];
    try {
      for (const file of postForm.images) {
        const url = await uploadToCloudinary(file);
        imageUrls.push(url);
      }
    } catch (err: any) {
      toast.error("Image upload failed: " + err.message);
      setPostLoading(false);
      return;
    }

    const { title, subject, boughtYear, description } = postForm;
    const { error } = await supabase
      .from("posts")
      .insert([
        {
          user_id: userId,
          email: authUserEmail,
          title,
          subject,
          bought_year: boughtYear,
          images: imageUrls,
          description: description,
        },
      ]);
    setPostLoading(false);
    if (error) {
      toast.error("Error creating post: " + error.message);
    } else {
      toast.success("Post created!");
      setOpenPostDialog(false);
      setPostForm(initialPostForm);
      setImagePreviews([]);
      fetchAllPosts();
    }
  };

  // --- APPLY BUTTON HANDLER (with names) ---
  const handleApply = async (post: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in first.");
      return;
    }

    // 1. Get the applicant's user profile (the one clicking Apply)
    const { data: applicantProfile } = await supabase
      .from("users")
      .select("id, name")
      .eq("email", user.email)
      .single();
    if (!applicantProfile) {
      toast.error("Your profile not found.");
      return;
    }

    // 2. Get the post owner's profile
    const { data: ownerProfile } = await supabase
      .from("users")
      .select("name")
      .eq("id", post.user_id)
      .single();
    if (!ownerProfile) {
      toast.error("Post owner not found.");
      return;
    }

    if (applicantProfile.id === post.user_id) {
      toast.error("You cannot apply to your own book.");
      return;
    }

    // 3. Check if already applied
    const { data: existing } = await supabase
      .from("applied_books")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", applicantProfile.id)
      .single();
    if (existing) {
      toast.error("You already applied for this book.");
      return;
    }

    // 4. Insert with both names
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
    if (error) {
      toast.error("Failed to apply: " + error.message);
    } else {
      toast.success("Request sent!");
      fetchAppliedAndApprovedPostIds(applicantProfile.id);
    }
  };

  // Filter out posts that are either created by me, already applied by me, or already approved/given away
  const postsToShow = posts.filter(
    (post) =>
      post.user_id !== userId &&
      !appliedPostIds.includes(post.id) &&
      !approvedPostIds.includes(post.id)
  );

  return (
    <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 py-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-violet-700">All Book Posts</h1>
      <SearchFilterBar
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        filterBy={filterBy}
        setFilterBy={setFilterBy}
        filterOptions={filterOptions}
        userProfile={userProfile}
        filterActive={filterActive}
        onClearFilter={onClearFilter}
      />
      <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
          <div className="flex justify-center items-center w-full col-span-4 py-8">
            <Loader2 className="animate-spin w-12 h-12 text-violet-600" />
          </div>
        ) : postsToShow.length === 0 ? (
          <NoPostsCard />
        ) : (
          postsToShow.map((post) => (
            <HomePostCard
              key={post.id}
              title={post.title || ""}
              description={post.description || post.subject || ""}
              imageUrl={
                Array.isArray(post.images) && post.images.length > 0
                  ? post.images[0]
                  : ""
              }
              boughtYear={post.bought_year}
              subject={post.subject}
              username={post.users?.name}
              onApply={() => handleApply(post)}
              onMoreDetails={() => navigate(`/dashboard/posts/${post.id}`)}
              isApplied={appliedPostIds.includes(post.id)}
            />
          ))
        )}
      </div>
      <Dialog open={openPostDialog} onOpenChange={setOpenPostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Book Post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePostSubmit} className="flex flex-col gap-5 mt-3">
            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                Book Title<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={postForm.title}
                onChange={handlePostChange}
                required
                placeholder="Enter book title"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
                disabled={postLoading}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                Subject<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={postForm.subject}
                onChange={handlePostChange}
                required
                placeholder="Enter book subject"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
                disabled={postLoading}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                Bought Year<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="boughtYear"
                value={postForm.boughtYear}
                onChange={handlePostChange}
                required
                min={1900}
                max={new Date().getFullYear()}
                placeholder="Year e.g. 2023"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
                disabled={postLoading}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                Description
              </label>
              <textarea
                name="description"
                value={postForm.description}
                onChange={handlePostChange}
                placeholder="Enter a description (optional)"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
                rows={3}
                disabled={postLoading}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                Book Images (max 3)<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative">
                    <img
                      src={src}
                      alt={`Preview ${i + 1}`}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      title="Remove image"
                      disabled={postLoading}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {postForm.images.length < 3 && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={imageInputRef}
                      style={{ display: "none" }}
                      onChange={handleAddImage}
                      disabled={postLoading}
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-violet-400 rounded bg-gray-50 hover:bg-gray-100 text-violet-700 font-bold text-2xl"
                      title="Add image"
                      disabled={postLoading}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
              {postForm.images.length > 3 && (
                <p className="text-red-500 text-xs mt-1">Only 3 images allowed.</p>
              )}
            </div>
            <DialogFooter>
              <button
                type="submit"
                disabled={postLoading}
                className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded font-semibold transition w-full flex items-center justify-center"
              >
                {postLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
                Create Post
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <button
        onClick={() => setOpenPostDialog(true)}
        className="fixed bottom-8 right-4 sm:bottom-10 sm:right-10 z-50 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-3xl transition"
        title="Add New Post"
        style={{
          boxShadow: "0 4px 24px 0 rgba(109, 40, 217, 0.15)",
        }}
      >
        <Plus className="w-8 h-8" />
      </button>
      {/* Mobile bottom padding for FAB */}
      <div className="block sm:hidden" style={{ height: "5rem" }}></div>
    </div>
  );
};

export default Home;