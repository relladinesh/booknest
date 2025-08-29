import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; // Update path as needed

type PostFormValues = {
  title: string;
  subject: string;
  boughtYear: string;
  images: File[];
};

type PostDialogProps = {
  onSubmit: (data: PostFormValues) => void;
};

const PostDialog: React.FC<PostDialogProps> = ({ onSubmit }) => {
  const [form, setForm] = useState<PostFormValues>({
    title: "",
    subject: "",
    boughtYear: "",
    images: [],
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).slice(0, 3) : [];
    setForm({ ...form, images: files });

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    setForm({
      title: "",
      subject: "",
      boughtYear: "",
      images: [],
    });
    setImagePreviews([]);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded font-semibold transition">
          + Add Post
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Book Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-3">
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Book Title<span className="text-red-500">*</span></label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
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
              value={form.subject}
              onChange={handleChange}
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
              value={form.boughtYear}
              onChange={handleChange}
              required
              min={1900}
              max={new Date().getFullYear()}
              placeholder="Year e.g. 2023"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Book Images (max 3)<span className="text-red-500">*</span></label>
            <input
              type="file"
              name="images"
              accept="image/*"
              multiple
              required
              onChange={handleImageChange}
              className="w-full px-2 py-2 border rounded"
            />
            <div className="flex gap-2 mt-2">
              {imagePreviews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Preview ${i + 1}`}
                  className="w-20 h-20 object-cover rounded border"
                />
              ))}
            </div>
            {form.images.length > 3 && (
              <p className="text-red-500 text-xs mt-1">Only 3 images allowed.</p>
            )}
          </div>
          <DialogFooter>
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded font-semibold transition w-full"
            >
              Create Post
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostDialog;