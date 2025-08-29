import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../supa/Supabaseclient";
import { Eye, X } from "lucide-react";

// Helper to show time in IST (Asia/Kolkata) in 12-hour format with manual offset for IST
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

function isYesterday(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getDate() === db.getDate() &&
    da.getMonth() === db.getMonth() &&
    da.getFullYear() === db.getFullYear()
  );
}

const BookRequestedByMe: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);

  // Messaging state
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Pagination state for mobile cards
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 8;

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMyRequests = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      // Get user id
      const { data: userProfile } = await supabase
        .from("users")
        .select("id")
        .eq("email", user.email)
        .single();
      if (!userProfile) {
        setLoading(false);
        return;
      }
      setUserId(userProfile.id);

      // Fetch applied_books where user_id = me
      const { data } = await supabase
        .from("applied_books")
        .select(`
          *,
          posts:post_id (id, title, user_id, owner: user_id (id, email, name))
        `)
        .eq("user_id", userProfile.id)
        .order("applied_at", { ascending: false });

      setRequests(data || []);
      setLoading(false);
    };
    fetchMyRequests();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(requests.length / cardsPerPage);
  const paginatedRequests = requests.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);

  // Fetch messages for an application
  const fetchMessages = async (appliedBookId: number) => {
    setMessagesLoading(true);
    const { data } = await supabase
      .from("applied_book_messages")
      .select(`
        *,
        users:sender_id (id, email, name)
      `)
      .eq("applied_book_id", appliedBookId)
      .order("sent_at", { ascending: true });
    setMessages(data || []);
    setMessagesLoading(false);
  };

  // Always scroll to bottom when messages change and not loading
  useEffect(() => {
    if (!messagesLoading) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, messagesLoading]);

  // Show modal for a request and load messages
  const showResponse = (appliedBook: any) => {
    setModalContent(appliedBook);
    setModalOpen(true);
    fetchMessages(appliedBook.id);
  };

  // Send a message
  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !modalContent?.id || !userId) return;
    setMessageLoading(true);
    await supabase.from("applied_book_messages").insert({
      applied_book_id: modalContent.id,
      sender_id: userId,
      message: messageText.trim(),
    });
    setMessageText("");
    setMessageLoading(false);
    fetchMessages(modalContent.id);
  };

  // Helper for message bubble styling
  const isMine = (reply: any) => reply.sender_id === userId;

  // Group messages by date for "Yesterday" label
  function groupMessagesWithLabels(msgs: any[]) {
    if (!msgs.length) return [];
    const groups: { day: string; label: string | null; messages: any[] }[] = [];
    let lastDate = "";

    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      const msgDate = m.sent_at.split("T")[0];
      let label: string | null = null;

      if (i === 0 || !isSameDay(m.sent_at, lastDate)) {
        if (isYesterday(m.sent_at)) label = "Yesterday";
        else if (new Date(m.sent_at).toDateString() === new Date().toDateString()) label = "Today";
        else label = new Date(m.sent_at).toLocaleDateString();
        groups.push({ day: msgDate, label, messages: [m] });
      } else {
        groups[groups.length - 1].messages.push(m);
      }
      lastDate = m.sent_at;
    }
    return groups;
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-2 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center text-violet-700">
        Books I Applied For
      </h2>
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          You have not applied for any books yet.
        </div>
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
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold"
                    onClick={() => showResponse(req)}
                  >
                    <Eye className="w-4 h-4" />
                    Open
                  </button>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600">Owner: </span>
                  <span className="text-gray-800">
                    {req.posts?.owner?.name || req.posts?.owner?.email || "Unknown"}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {req.posts?.owner?.email}
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
                    Book Title
                  </th>
                  <th className="py-2 px-4 text-left font-semibold text-violet-700">
                    Owner
                  </th>
                  <th className="py-2 px-4 text-left font-semibold text-violet-700">
                    Applied At
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
                    <td className="py-2 px-4 truncate max-w-[160px]">
                      {req.posts?.title || "Unknown"}
                    </td>
                    <td className="py-2 px-4">
                      <div className="font-medium text-gray-800 truncate max-w-[160px]">
                        {req.posts?.owner?.name || req.posts?.owner?.email || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {req.posts?.owner?.email}
                      </div>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      {req.applied_at ? formatDateTimeIST(req.applied_at) : ""}
                    </td>
                    <td className="py-2 px-4 capitalize whitespace-nowrap">
                      <span
                        className={
                          req.status === "pending"
                            ? "text-yellow-600"
                            : req.status === "approved"
                            ? "text-green-600"
                            : req.status === "rejected"
                            ? "text-red-600"
                            : ""
                        }
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <button
                        className="inline-flex items-center justify-center rounded-full bg-violet-100 hover:bg-violet-200 text-violet-700 p-2 transition"
                        onClick={() => showResponse(req)}
                        title="See chat and contact"
                      >
                        <Eye className="w-5 h-5" />
                        <span className="ml-1 text-xs font-semibold hidden md:inline">
                          Open
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal for chat, status, and contact info */}
      {modalOpen && modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xs sm:max-w-md relative flex flex-col h-[80vh] max-h-[600px] mx-2">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-bold text-violet-700">Book Application</h3>
              <button
                className="text-gray-400 hover:text-black"
                onClick={() => {
                  setModalOpen(false);
                  setMessages([]);
                  setMessageText("");
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-3 sm:px-4 py-2">
              <div className="mb-1">
                <strong>Book:</strong> {modalContent?.posts?.title || "Unknown"}
              </div>
              <div className="mb-1">
                <strong>Status:</strong>{" "}
                <span
                  className={
                    modalContent.status === "approved"
                      ? "text-green-700"
                      : modalContent.status === "rejected"
                      ? "text-red-700"
                      : "text-yellow-700"
                  }
                >
                  {modalContent.status}
                </span>
              </div>
              {modalContent.status === "approved" && (
                <div className="mb-1">
                  <strong>Contact Info:</strong>
                  <div className="bg-violet-50 border rounded px-3 py-2 mt-1 text-gray-700 break-words">
                    {modalContent.owner_contact || "No contact info shared yet."}
                  </div>
                </div>
              )}
              {modalContent.status === "rejected" && (
                <div className="mb-1 text-red-700">Your request was rejected.</div>
              )}
            </div>
            {/* Chat Section */}
            <div className="flex-1 flex flex-col px-2 py-2 bg-gray-50 border-t border-b overflow-y-auto">
              {messagesLoading ? (
                <div className="text-gray-400 text-center my-4">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-400 text-center my-4">No messages yet.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {groupMessagesWithLabels(messages).map((group, idx) => (
                    <React.Fragment key={idx}>
                      {group.label && (
                        <div className="text-center text-purple-700 font-semibold my-2 text-xs">
                          {group.label}
                        </div>
                      )}
                      {group.messages.map((m: any) => (
                        <div
                          key={m.id}
                          className={`flex ${isMine(m) ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`
                              px-3 py-2 rounded-2xl shadow
                              ${isMine(m)
                                ? "bg-violet-500 text-white rounded-br-md"
                                : "bg-white text-purple-800 border rounded-bl-md"
                              }
                              max-w-[75%]
                              flex flex-col
                            `}
                          >
                            <div className="mb-1 text-xs font-semibold">
                              {isMine(m)
                                ? "Me"
                                : m.users?.name || m.users?.email || "User"}
                            </div>
                            <div>{m.message}</div>
                            <div className="text-[10px] text-purple-300 mt-1 text-right">
                              {formatTimeIST(m.sent_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
            <form
              onSubmit={handleMessageSubmit}
              className="flex gap-2 p-2 border-t bg-violet-50"
            >
              <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                className="w-full border rounded px-2 py-1 resize-none"
                rows={1}
                placeholder="Type a message..."
                disabled={messageLoading}
                style={{ minHeight: 36, maxHeight: 120 }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleMessageSubmit(e as any);
                  }
                }}
              />
              <button
                type="submit"
                className="px-3 sm:px-4 py-2 rounded bg-violet-600 text-white font-semibold hover:bg-violet-700"
                disabled={messageLoading || !messageText.trim()}
              >
                {messageLoading ? "..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookRequestedByMe;