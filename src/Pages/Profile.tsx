import React, { useState, useRef, useEffect } from "react";
import PostCard, { NoPostsCard } from "../Component/PostCards";
import { supabase } from "../../supa/Supabaseclient";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

// --- Add resizeImage utility here ---
async function resizeImage(file: File, size = 517): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const minLen = Math.min(img.width, img.height);
      const sx = (img.width - minLen) / 2;
      const sy = (img.height - minLen) / 2;
      ctx.drawImage(img, sx, sy, minLen, minLen, 0, 0, size, size);
      canvas.toBlob((blob) => {
        resolve(new File([blob!], file.name, { type: file.type }));
      }, file.type);
    };
    reader.readAsDataURL(file);
  });
}

async function uploadToCloudinary(file: File): Promise<string> {
  // Resize to 517x517 before uploading
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

const defaultUser = {
  name: "",
  phone: "",
  email: "",
  city: "",
  pincode: "",
  address: "",
  area: "", // Added area field
  avatar: "",
};

const Profile: React.FC = () => {
  const [form, setForm] = useState(defaultUser);
  const [avatarPreview, setAvatarPreview] = useState(form.avatar);
  const [userId, setUserId] = useState<number | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [authUserEmail, setAuthUserEmail] = useState<string>("");
  const [showForm, setShowForm] = useState(true);
  const [loading, setLoading] = useState(false); // loader for profile
  const [postLoading, setPostLoading] = useState(false); // loader for post
  const [avatarUploading, setAvatarUploading] = useState(false); // loader for avatar

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Add post dialog state
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [postForm, setPostForm] = useState({
    title: "",
    subject: "",
    boughtYear: "",
    images: [] as File[],
    description: "",
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchAuthEmail = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        toast.error("Error fetching auth user");
        return;
      }
      if (user && user.email) {
        setAuthUserEmail(user.email);
      }
    };
    fetchAuthEmail();
  }, []);

  useEffect(() => {
    if (!authUserEmail) return;
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("email", authUserEmail)
        .single();
      setLoading(false);

      if (data) {
        setForm(data);
        setAvatarPreview(data.avatar);
        setUserId(data.id);
        setShowForm(false);
      } else {
        setForm({ ...defaultUser, email: authUserEmail });
        setShowForm(true);
      }
    };
    fetchProfile();
  }, [authUserEmail]);

  useEffect(() => {
    if (!userId) return;
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select()
        .eq("user_id", userId);
      setLoading(false);
      if (data) setUserPosts(data);
    };
    fetchPosts();
  }, [userId]);

  // Convert area name to lowercase before saving to backend
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "area" ? value.toLowerCase() : value,
    });
  };

  // Avatar upload (with resizing)
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setAvatarUploading(true);
        const localUrl = URL.createObjectURL(file);
        setAvatarPreview(localUrl);

        // Upload with resize
        const uploadedUrl = await uploadToCloudinary(file);
        setAvatarPreview(uploadedUrl);
        setForm(prevForm => ({
          ...prevForm,
          avatar: uploadedUrl
        }));
        toast.success("Profile picture uploaded!");
      } catch (error: any) {
        toast.error("Avatar upload failed: " + error.message);
      }
      setAvatarUploading(false);
    }
  };

  // Ensure .select() is used so userId is set correctly for new users
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let result;
    const upsertData = { ...form, email: authUserEmail };

    if (userId) {
      result = await supabase
        .from("users")
        .update(upsertData)
        .eq("id", userId);
    } else {
      result = await supabase
        .from("users")
        .insert([upsertData])
        .select(); // Ensures we get inserted row back!
      if (result.data && result.data[0]) {
        setUserId(result.data[0].id);
        setForm(result.data[0]);
        setAvatarPreview(result.data[0].avatar);
      }
    }
    setLoading(false);
    if (result.error) {
      toast.error("Error updating profile: " + result.error.message);
    } else {
      toast.success("Profile updated!");
      setShowForm(false);
    }
  };

  const handleEdit = () => {
    setShowForm(true);
  };

  const handlePostChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPostForm({ ...postForm, [e.target.name]: e.target.value });
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && postForm.images.length < 3) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostForm(prev => ({
          ...prev,
          images: [...prev.images, file],
        }));
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleRemoveImage = (idx: number) => {
    setPostForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // Delete post
  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setPostLoading(true);
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);
    setPostLoading(false);
    if (error) {
      toast.error("Error deleting post: " + error.message);
    } else {
      toast.success("Post deleted!");
      setUserPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  // Respond handler
  const handleRespond = (post: any) => {
    toast.success(`Responded to: ${post.title}`);
    // You can add more logic here (open dialog, send message, etc)
  };

  // This already checks userId before post.
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("User not found, please save your profile first.");
      return;
    }
    setPostLoading(true);

    let imageUrls: string[] = [];
    try {
      // --- Resize & upload each image before saving ---
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
          description,
        },
      ]);
    setPostLoading(false);
    if (error) {
      toast.error("Error creating post: " + error.message);
    } else {
      toast.success("Post created!");
      setOpenPostDialog(false);
      setPostForm({
        title: "",
        subject: "",
        boughtYear: "",
        images: [],
        description: "",
      });
      setImagePreviews([]);
      const { data } = await supabase
        .from("posts")
        .select()
        .eq("user_id", userId);
      if (data) setUserPosts(data);
    }
  };

  const ProfileView = () => (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-10">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 text-center">My Profile</h2>
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="relative">
          <img
            src={avatarPreview || "https://ui-avatars.com/api/?name=User"}
            alt="Profile"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-violet-500"
          />
          {avatarUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-full">
              <Loader2 className="animate-spin w-8 h-8 text-violet-600" />
            </div>
          )}
        </div>
        <span className="font-semibold text-base sm:text-lg mt-2">{form.name}</span>
        <span className="text-xs sm:text-sm text-gray-400">{form.email}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><strong>Name:</strong> {form.name}</div>
        <div><strong>Phone:</strong> {form.phone}</div>
        <div><strong>Email:</strong> {form.email}</div>
        <div><strong>City:</strong> {form.city}</div>
        <div><strong>Area:</strong> {form.area}</div>
        <div><strong>Pin Code:</strong> {form.pincode}</div>
        <div className="sm:col-span-2"><strong>Address:</strong> {form.address}</div>
      </div>
      <button
        type="button"
        onClick={handleEdit}
        className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded font-semibold transition w-full mt-4"
      >
        Edit
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto w-full px-2 sm:px-4">
      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-4 sm:p-6 mb-10">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 text-center">My Profile</h2>
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="relative">
              <img
                src={avatarPreview || "https://ui-avatars.com/api/?name=User"}
                alt="Profile"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-violet-500"
              />
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-full">
                  <Loader2 className="animate-spin w-8 h-8 text-violet-600" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-violet-600 hover:bg-violet-700 text-white rounded-full p-2 shadow transition"
                title="Change profile picture"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-1.5A2.5 2.5 0 1116.5 7.5l-9 9A2 2 0 015 17v2h2a2 2 0 002-2v-2.586a1 1 0 01.293-.707l9-9z" />
                </svg>
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <span className="font-semibold text-base sm:text-lg mt-2">{form.name}</span>
            <span className="text-xs sm:text-sm text-gray-400">{form.email}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                readOnly
                className="w-full px-4 py-2 border rounded bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Enter your city"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Area</label>
              <input
                type="text"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="Enter your area"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Pin Code</label>
              <input
                type="text"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="Enter your pin code"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
                required
              />
            </div>
            <div className="mb-4 sm:col-span-2">
              <label className="block text-gray-700 mb-1">Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter your address"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
                rows={2}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded font-semibold transition w-full mt-2 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
            Save
          </button>
        </form>
      ) : (
        <ProfileView />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-0 text-gray-800">My Posts</h3>
        <Dialog open={openPostDialog} onOpenChange={setOpenPostDialog}>
          <DialogTrigger asChild>
            <button
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded font-semibold transition mt-2 sm:mt-0"
            >
              + Add Post
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Book Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePostSubmit} className="flex flex-col gap-5 mt-3">
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Book Title<span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={postForm.title}
                  onChange={handlePostChange}
                  required
                  placeholder="Enter book title"
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Subject<span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="subject"
                  value={postForm.subject}
                  onChange={handlePostChange}
                  required
                  placeholder="Enter book subject"
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Bought Year<span className="text-red-500">*</span></label>
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
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Description</label>
                <textarea
                  name="description"
                  value={postForm.description}
                  onChange={handlePostChange}
                  placeholder="Enter a description (optional)"
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Book Images (max 3)<span className="text-red-500">*</span></label>
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
                      />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-violet-400 rounded bg-gray-50 hover:bg-gray-100 text-violet-700 font-bold text-2xl"
                        title="Add image"
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
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {loading ? (
          <div className="flex justify-center items-center w-full col-span-2 py-8">
            <Loader2 className="animate-spin w-12 h-12 text-violet-600" />
          </div>
        ) : userPosts.length === 0 ? (
          <NoPostsCard />
        ) : (
          userPosts.map((post) => (
            <div key={post.id} className="relative">
              <PostCard
                title={post.title}
                description={post.description}
                imageUrl={post.images?.[0] || post.image_url}
                onBook={() => toast.success(`Booked: ${post.title}`)}
                onDelete={() => handleDeletePost(post.id)}
                onRespond={() => handleRespond(post)}
                showActions={true}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;