import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../supa/Supabaseclient";
import { MessageCircle, X } from "lucide-react";
import { toast } from "react-hot-toast";

// Helper functions
function formatTimeIST(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  date.setMinutes(date.getMinutes() + 330);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
function formatDateTimeIST(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  date.setMinutes(date.getMinutes() + 330);
  return date.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const BookRequestsForMe: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  // Modal/dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<"accept" | "reject" | "reply" | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [contactInfo, setContactInfo] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reply state
  const [replies, setReplies] = useState<any[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

  // Pagination for mobile cards
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 8;

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch requests
  const fetchUserAndRequests = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: userProfile } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("email", user.email)
      .single();
    if (!userProfile) {
      setLoading(false);
      return;
    }
    setUserId(userProfile.id);

    const { data: myPosts } = await supabase
      .from("posts")
      .select("id, title")
      .eq("user_id", userProfile.id);

    const myPostIds = (myPosts || []).map((p: any) => p.id);
    if (!myPostIds.length) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("applied_books")
      .select(`
        *,
        posts:post_id (title),
        requester:user_id (name, email)
      `)
      .in("post_id", myPostIds)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserAndRequests();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(requests.length / cardsPerPage);
  const paginatedRequests = requests.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);

  // Always scroll to bottom when replies change and not loading
  useEffect(() => {
    if (!repliesLoading) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [replies, repliesLoading]);

  const openActionDialog = (type: "accept" | "reject" | "reply", request: any) => {
    setDialogType(type);
    setSelectedRequest(request);
    setContactInfo(request.owner_contact || "");
    setRejectReason("");
    setReplyText("");
    setOpenDialog(true);
    if (type === "reply") {
      fetchReplies(request.id);
    }
  };

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmitting(true);

    if (dialogType === "accept") {
      // 1. Update applied_books status to approved and set owner_contact
      const { error: updateError } = await supabase
        .from("applied_books")
        .update({
          status: "approved",
          owner_contact: contactInfo,
        })
        .eq("id", selectedRequest.id);

      if (updateError) {
        toast.error("Failed to approve request: " + updateError.message);
        setSubmitting(false);
        return;
      }

      // 2. Delete the post from posts table
      if (selectedRequest.post_id) {
        const { error: deleteError } = await supabase
          .from("posts")
          .delete()
          .eq("id", selectedRequest.post_id);
        if (deleteError) {
          toast.error("Error deleting post: " + deleteError.message);
        }
      }

      // 3. Remove all other requests for this post from local state
      setRequests((reqs) =>
        reqs.filter((r) => r.post_id !== selectedRequest.post_id)
      );
    } else if (dialogType === "reject") {
      await supabase
        .from("applied_books")
        .update({
          status: "rejected",
          reject_reason: rejectReason,
        })
        .eq("id", selectedRequest.id);
      setRequests((reqs) =>
        reqs.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: "rejected", reject_reason: rejectReason }
            : r
        )
      );
    }
    setSubmitting(false);
    setOpenDialog(false);
    setSelectedRequest(null);
    setDialogType(null);
  };

  const fetchReplies = async (appliedBookId: number) => {
    setRepliesLoading(true);
    const { data } = await supabase
      .from("applied_book_messages")
      .select("*, users:sender_id (name, email)")
      .eq("applied_book_id", appliedBookId)
      .order("sent_at", { ascending: true });
    setReplies(data || []);
    setRepliesLoading(false);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedRequest?.id || !userId) return;
    setSubmitting(true);
    await supabase.from("applied_book_messages").insert({
      applied_book_id: selectedRequest.id,
      sender_id: userId,
      message: replyText.trim(),
    });
    setReplyText("");
    setSubmitting(false);
    fetchReplies(selectedRequest.id);
  };

  const isMine = (reply: any) => reply.sender_id === userId;

  return (
    <div className="w-full max-w-3xl mx-auto p-2 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center text-violet-700">
        Book Requests
      </h2>
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No requests yet.</div>
      ) : (
        <>
          {/* Mobile Card View with Pagination */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {paginatedRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-violet-100 bg-white shadow p-4 flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <div className="font-bold text-violet-700 truncate">
                    {req.posts?.title || "Unknown"}
                  </div>
                  <div className="flex gap-2">
                    {req.status === "pending" ? (
                      <>
                        <button
                          className="px-2 py-1 rounded bg-green-500 text-white font-semibold text-xs"
                          onClick={() => openActionDialog("accept", req)}
                        >
                          ✓
                        </button>
                        <button
                          className="px-2 py-1 rounded bg-red-500 text-white font-semibold text-xs"
                          onClick={() => openActionDialog("reject", req)}
                        >
                          ✗
                        </button>
                      </>
                    ) : (
                      <button
                        className="flex items-center gap-1 px-2 py-1 rounded bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold"
                        onClick={() => openActionDialog("reply", req)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Requester: </span>
                  <span className="text-gray-800">
                    {req.requester?.name || req.requester?.email || <span className="italic text-gray-400">Unknown</span>}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {req.requester?.email}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {req.applied_at ? formatTimeIST(req.applied_at) : ""}
                  </span>
                  <span className={
                    req.status === "pending"
                      ? "text-yellow-600"
                      : req.status === "approved"
                      ? "text-green-600"
                      : req.status === "rejected"
                      ? "text-red-600"
                      : ""
                  }>
                    {req.status}
                  </span>
                </div>
                <div className="text-xs truncate">{req.posts?.title}</div>
              </div>
            ))}
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-2">
                <button
                  className="px-3 py-1 bg-violet-100 hover:bg-violet-200 rounded text-violet-700"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Prev
                </button>
                <span className="text-sm font-semibold text-violet-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="px-3 py-1 bg-violet-100 hover:bg-violet-200 rounded text-violet-700"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
          {/* Desktop Table View */}
          <div className="overflow-x-auto rounded-lg shadow bg-white hidden sm:block">
            <table className="min-w-full border border-violet-100 text-xs md:text-sm">
              <thead className="bg-violet-50">
                <tr>
                  <th className="py-2 px-4 text-left font-semibold text-violet-700">
                    Requester
                  </th>
                  <th className="py-2 px-4 text-left font-semibold text-violet-700">
                    Book Title
                  </th>
                  <th className="py-2 px-4 text-left font-semibold text-violet-700">
                    Requested At
                  </th>
                  <th className="py-2 px-4 text-left font-semibold text-violet-700">
                    Status
                  </th>
                  <th className="py-2 px-4 text-center font-semibold text-violet-700">
                    Chat
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-t border-violet-100">
                    <td className="py-2 px-4">
                      <div className="font-medium text-gray-800 truncate max-w-[120px] md:max-w-full">
                        {req.requester?.name || req.requester?.email || <span className="italic text-gray-400">Unknown</span>}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {req.requester?.email}
                      </div>
                    </td>
                    <td className="py-2 px-4 truncate max-w-[120px] md:max-w-full">{req.posts?.title}</td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      {req.applied_at ? formatDateTimeIST(req.applied_at) : ""}
                    </td>
                    <td className="py-2 px-4 capitalize whitespace-nowrap">
                      <span className={
                        req.status === "pending"
                          ? "text-yellow-600"
                          : req.status === "approved"
                          ? "text-green-600"
                          : req.status === "rejected"
                          ? "text-red-600"
                          : ""
                      }>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <div className="flex gap-2 justify-center">
                        {req.status === "pending" ? (
                          <>
                            <button
                              className="px-2 py-1 rounded bg-green-500 text-white font-semibold text-xs md:text-sm"
                              onClick={() => openActionDialog("accept", req)}
                            >
                              Accept
                            </button>
                            <button
                              className="px-2 py-1 rounded bg-red-500 text-white font-semibold text-xs md:text-sm"
                              onClick={() => openActionDialog("reject", req)}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            className="inline-flex items-center justify-center rounded-full bg-violet-100 hover:bg-violet-200 text-violet-700 p-2 transition"
                            title="Reply/See replies"
                            onClick={() => openActionDialog("reply", req)}
                          >
                            <MessageCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Dialog for accept/reject */}
      {openDialog && (dialogType === "accept" || dialogType === "reject") && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-xs sm:max-w-md shadow-xl mx-2">
            <form onSubmit={handleDialogSubmit}>
              <h3 className="text-lg font-bold mb-4 text-violet-700">
                {dialogType === "accept"
                  ? "How can the requester contact you?"
                  : "Please provide an apology or reason for rejection"}
              </h3>
              {dialogType === "accept" ? (
                <>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Email / Phone / Message
                  </label>
                  <textarea
                    required
                    value={contactInfo}
                    onChange={e => setContactInfo(e.target.value)}
                    className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    rows={3}
                    placeholder="e.g. Call me at 123-456-7890 or email: example@mail.com"
                    disabled={submitting}
                  />
                </>
              ) : (
                <>
                  <label className="block mb-2 font-semibold text-gray-700">
                    Apology or Reason
                  </label>
                  <textarea
                    required
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    rows={3}
                    placeholder="e.g. Sorry, book already given away."
                    disabled={submitting}
                  />
                </>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400"
                  onClick={() => setOpenDialog(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded ${dialogType === "accept" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white font-semibold`}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : (dialogType === "accept" ? "Accept" : "Reject")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog for reply/response */}
      {openDialog && dialogType === "reply" && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-0 w-full max-w-xs sm:max-w-md relative flex flex-col h-[80vh] max-h-[600px] mx-2">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-bold text-violet-700">Conversation</h3>
              <button
                className="text-gray-400 hover:text-black"
                onClick={() => { setOpenDialog(false); setReplies([]); setReplyText(""); }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col px-2 py-2 bg-gray-50 border-t border-b overflow-y-auto">
              {repliesLoading ? (
                <div className="text-gray-400 text-center my-4">Loading...</div>
              ) : (
                replies.length === 0 ? (
                  <div className="text-gray-400 text-center my-4">No replies yet.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {replies.map((r: any) => (
                      <div
                        key={r.id}
                        className={`flex ${isMine(r) ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`
                          px-3 py-2 rounded-2xl shadow
                          ${isMine(r)
                            ? "bg-violet-500 text-white rounded-br-md"
                            : "bg-white text-purple-800 border rounded-bl-md"
                          }
                          max-w-[80%]
                          flex flex-col
                          `}
                        >
                          <div className="mb-1 text-xs font-semibold">
                            {isMine(r) ? "Me" : r.users?.name || r.users?.email || "User"}
                          </div>
                          <div>{r.message}</div>
                          <div className="text-[10px] text-purple-300 mt-1 text-right">
                            {r.sent_at ? formatTimeIST(r.sent_at) : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )
              )}
            </div>
            <form
              onSubmit={handleReplySubmit}
              className="flex gap-2 p-2 border-t bg-violet-50"
            >
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="w-full border rounded px-2 py-1 resize-none"
                rows={1}
                placeholder="Type a reply..."
                disabled={submitting}
                style={{ minHeight: 36, maxHeight: 120 }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleReplySubmit(e as any);
                  }
                }}
              />
              <button
                type="submit"
                className="px-3 py-2 sm:px-4 rounded bg-violet-600 text-white font-semibold hover:bg-violet-700"
                disabled={submitting || !replyText.trim()}
              >
                {submitting ? "..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookRequestsForMe;