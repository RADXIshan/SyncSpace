import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  FileText,
  Eye,
  Edit,
  Trash2,
  Search,
  Download,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ConfirmationModal from "./ConfirmationModal";

const MeetingReports = ({ channelId, channelName, orgId, showAll = false }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [organizationData, setOrganizationData] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false,
  });

  // Helper function to check if user can delete/edit a report
  const canModifyReport = (report) => {
    if (!user || !report) return false;
    
    // User created the report
    const isCreator = report.createdBy.id === user.user_id;
    
    // User is organization owner (server returns createdBy in camelCase)
    const isOrgOwner = organizationData?.createdBy === user.user_id;
    
    // Debug logging (can be removed in production)
    if (import.meta.env.DEV) {
      console.log('Permission check:', {
        userId: user.user_id,
        reportCreator: report.createdBy.id,
        orgOwner: organizationData?.createdBy,
        isCreator,
        isOrgOwner,
        canModify: isCreator || isOrgOwner
      });
    }
    
    return isCreator || isOrgOwner;
  };

  // Fetch organization data
  const fetchOrganizationData = useCallback(async () => {
    if (!orgId) return;
    
    try {
      const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
      const response = await axios.get(`${baseURL}/api/orgs/${orgId}`, {
        withCredentials: true,
      });
      setOrganizationData(response.data.organization);
    } catch (error) {
      console.error("Error fetching organization data:", error);
    }
  }, [orgId]);

  // Fetch meeting reports
  const fetchReports = useCallback(async (offset = 0) => {
    try {
      setLoading(true);
      const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
      const endpoint = showAll 
        ? `${baseURL}/api/meeting-reports/organization/${orgId}`
        : `${baseURL}/api/meeting-reports/channel/${channelId}`;
      
      const response = await axios.get(endpoint, {
        params: { limit: pagination.limit, offset },
        withCredentials: true,
      });

      const reportsArray = response.data.reports || [];

      if (offset === 0) {
        setReports(reportsArray);
      } else {
        setReports(prev => [...prev, ...reportsArray]);
      }
      
      setPagination(response.data.pagination || {
        total: 0,
        limit: pagination.limit,
        offset: offset,
        hasMore: false
      });
    } catch (error) {
      console.error("Error fetching meeting reports:", error);

      if (error.response?.status === 403) {
        toast.error("You don't have permission to view meeting reports");
      } else if (error.response?.status === 404) {
        toast.error("Channel not found");
      } else {
        toast.error("Failed to load meeting reports");
      }
      // Set empty state on error
      setReports([]);
      setPagination({
        total: 0,
        limit: pagination.limit,
        offset: 0,
        hasMore: false
      });
    } finally {
      setLoading(false);
    }
  }, [showAll, orgId, channelId, pagination.limit]);

  // Fetch single report details
  const fetchReportDetails = async (reportId) => {
    try {
      const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
      const response = await axios.get(`${baseURL}/api/meeting-reports/${reportId}`, {
        withCredentials: true,
      });
      setSelectedReport(response.data.report);
      setSummaryText(response.data.report.summary || "");
      setShowReportModal(true);
    } catch (error) {
      console.error("Error fetching report details:", error);
      toast.error("Failed to load report details");
    }
  };

  // Update report summary
  const updateSummary = async () => {
    if (!selectedReport) return;

    try {
      const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
      await axios.put(
        `${baseURL}/api/meeting-reports/${selectedReport.id}`,
        { summary: summaryText },
        { withCredentials: true }
      );
      
      setSelectedReport(prev => ({ ...prev, summary: summaryText }));
      setEditingSummary(false);
      toast.success("Summary updated successfully");
      
      // Update the report in the list
      setReports(prev => 
        prev.map(report => 
          report.id === selectedReport.id 
            ? { ...report, summary: summaryText }
            : report
        )
      );
    } catch (error) {
      console.error("Error updating summary:", error);
      toast.error("Failed to update summary");
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (report) => {
    setReportToDelete(report);
    setShowDeleteModal(true);
    // Close the report modal if it's open
    if (showReportModal) {
      setShowReportModal(false);
    }
  };

  // Delete report
  const confirmDeleteReport = async () => {
    if (!reportToDelete) return;

    try {
      setDeleteLoading(true);
      const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
      await axios.delete(`${baseURL}/api/meeting-reports/${reportToDelete.id}`, {
        withCredentials: true,
      });
      
      setReports(prev => prev.filter(report => report.id !== reportToDelete.id));
      setShowReportModal(false);
      setShowDeleteModal(false);
      setReportToDelete(null);
      toast.success("Meeting report deleted successfully");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setReportToDelete(null);
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter reports based on search term
  const filteredReports = (reports || []).filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (showAll && report.channelName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Export comprehensive reports with all details
  const exportReports = async () => {
    if (filteredReports.length === 0) {
      toast.error("No reports to export");
      return;
    }

    try {
      setExportLoading(true);
      // Fetch detailed data for all reports
      const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
      const detailedReports = await Promise.all(
        filteredReports.map(async (report) => {
          try {
            const response = await axios.get(`${baseURL}/api/meeting-reports/${report.id}`, {
              withCredentials: true,
            });
            return response.data.report;
          } catch (error) {
            console.error(`Error fetching details for report ${report.id}:`, error);
            return report; // Fallback to basic report data
          }
        })
      );

      const csvHeaders = [
        "Report ID",
        "Meeting Title",
        "Channel Name",
        "Started At",
        "Ended At", 
        "Duration (minutes)",
        "Duration (formatted)",
        "Total Participants",
        "Participant Names",
        "Participant Emails",
        "Participant Details (Name & Email)",
        "Total Messages",
        "Chat Messages",
        "Created By",
        "Created By Email",
        "Report Created At",
        "Room ID",
        "Organization ID",
        "Channel ID",
        "Summary",
        "Has Summary"
      ];

      const csvData = detailedReports.map(report => {
        const participants = Array.isArray(report.participants) ? report.participants : [];
        const messages = Array.isArray(report.messagesData) ? report.messagesData : [];
        
        const participantNames = participants.length > 0 
          ? participants.map(p => p.name || p.user_name || 'Unknown').join('; ')
          : 'No participants recorded';
        const participantEmails = participants.length > 0
          ? participants.map(p => p.email || 'N/A').join('; ')
          : 'N/A';
        
        // Format participant details with both name and email
        const participantDetails = participants.length > 0
          ? participants.map(p => 
              `${p.name || p.user_name || 'Unknown'} (${p.email || 'N/A'})`
            ).join('; ')
          : 'No participants recorded';
        
        // Format chat messages with timestamps
        const chatMessages = messages.length > 0
          ? messages.map(msg => 
              `[${new Date(msg.created_at).toLocaleTimeString()}] ${msg.user_name || 'Unknown'}: ${msg.content || ''}`
            ).join(' | ')
          : 'No messages recorded';
        
        return [
          report.id,
          report.title,
          showAll ? report.channelName : channelName,
          new Date(report.startedAt).toISOString(),
          new Date(report.endedAt).toISOString(),
          report.durationMinutes,
          formatDuration(report.durationMinutes),
          participants.length,
          participantNames,
          participantEmails,
          participantDetails,
          report.messageCount || messages.length,
          chatMessages.replace(/"/g, '""').replace(/\n/g, ' '),
          report.createdBy.name,
          report.createdBy.email || 'N/A',
          new Date(report.createdAt).toISOString(),
          report.roomId,
          report.orgId,
          report.channelId,
          (report.summary || "").replace(/"/g, '""').replace(/\n/g, ' '), // Escape quotes and newlines for CSV
          report.summary ? 'Yes' : 'No'
        ];
      });

      const csvContent = [
        csvHeaders.join(","),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      
      // Create more descriptive filename
      const dateStr = new Date().toISOString().split('T')[0];
      const channelStr = showAll ? 'all-channels' : (channelName || 'channel').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `comprehensive-meeting-reports-${channelStr}-${dateStr}.csv`;
      
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${detailedReports.length} comprehensive reports exported successfully`);
    } catch (error) {
      console.error("Error exporting comprehensive reports:", error);
      toast.error("Failed to export comprehensive reports");
    } finally {
      setExportLoading(false);
    }
  };

  // Load more reports
  const loadMore = () => {
    if (pagination.hasMore) {
      fetchReports(pagination.offset + pagination.limit);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchOrganizationData();
    }
    if (channelId || (showAll && orgId)) {
      fetchReports();
    }
  }, [channelId, orgId, showAll]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (showDeleteModal) {
          cancelDelete();
        } else if (showReportModal) {
          setShowReportModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showReportModal, showDeleteModal]);

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Meeting Reports
            {!showAll && channelName && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                - {channelName}
              </span>
            )}
          </h2>
          <p className="text-gray-600 mt-1">
            View and manage meeting reports and summaries
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        {filteredReports.length > 0 && (
          <button
            onClick={exportReports}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            title="Export comprehensive reports with all details including participants, chat messages, and summaries"
          >
            {exportLoading ? (
              <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Download size={18} />
            )}
            <span className="hidden sm:inline">
              {exportLoading ? "Exporting..." : "Export CSV"}
            </span>
          </button>
        )}
      </div>

      {/* Summary Stats */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FileText size={16} />
              <span className="text-sm">Total Reports</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{pagination.total || reports.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Clock size={16} />
              <span className="text-sm">Total Duration</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatDuration(reports.reduce((sum, report) => sum + (report.durationMinutes || 0), 0))}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Users size={16} />
              <span className="text-sm">Avg Participants</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {reports.length > 0 ? Math.round(reports.reduce((sum, report) => sum + (Array.isArray(report.participants) ? report.participants.length : 0), 0) / reports.length) : 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <MessageSquare size={16} />
              <span className="text-sm">Total Messages</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {reports.reduce((sum, report) => sum + (report.messageCount || 0), 0)}
            </p>
          </div>
        </div>
      )}

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No meeting reports found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? "No reports match your search criteria. Try adjusting your search terms."
              : "Meeting reports will appear here after meetings end. Start a meeting in this channel to generate reports."
            }
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {report.title}
                    </h3>
                    {showAll && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                        {report.channelName}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>{formatDate(report.startedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{formatDuration(report.durationMinutes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>{Array.isArray(report.participants) ? report.participants.length : 0} participants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={16} />
                      <span>{report.messageCount} messages</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Created by</span>
                    <div className="flex items-center gap-2">
                      {report.createdBy.photo ? (
                        <img
                          src={report.createdBy.photo}
                          alt={report.createdBy.name}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {report.createdBy.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium">{report.createdBy.name}</span>
                    </div>
                  </div>

                  {/* Participants Preview */}
                  {Array.isArray(report.participants) && report.participants.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Participants:</span>
                        <div className="flex -space-x-2">
                          {report.participants.slice(0, 5).map((participant, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center"
                              title={participant.name || participant.user_name || "Unknown"}
                            >
                              <span className="text-xs text-white font-medium">
                                {(participant.name || participant.user_name || "U").charAt(0).toUpperCase()}
                              </span>
                            </div>
                          ))}
                          {report.participants.length > 5 && (
                            <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center">
                              <span className="text-xs text-white font-medium">
                                +{report.participants.length - 5}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {report.participants.slice(0, 3).map((participant, index) => (
                          <span
                            key={index}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                          >
                            {participant.name || participant.user_name || "Unknown"}
                          </span>
                        ))}
                        {report.participants.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{report.participants.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {report.summary && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {report.summary}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => fetchReportDetails(report.id)}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                    title="View details"
                  >
                    <Eye size={18} />
                  </button>
                  
                  {canModifyReport(report) && (
                    <button
                      onClick={() => showDeleteConfirmation(report)}
                      disabled={deleteLoading && reportToDelete?.id === report.id}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      title="Delete report"
                    >
                      {deleteLoading && reportToDelete?.id === report.id ? (
                        <div className="w-[18px] h-[18px] border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Report Details Modal */}
      {showReportModal && selectedReport && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 transition-all duration-300"
          onClick={() => setShowReportModal(false)}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[98vh] sm:max-h-[95vh] glass-dark rounded-2xl sm:rounded-3xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 cosmic-bg"></div>
            <div className="relative overflow-y-auto max-h-[98vh] sm:max-h-[95vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700/50">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white gradient-text">
                    {selectedReport.title}
                  </h2>
                  <p className="text-gray-300 mt-1 text-sm sm:text-base">
                    {formatDate(selectedReport.startedAt)} • {formatDuration(selectedReport.durationMinutes)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canModifyReport(selectedReport) && (
                    <button
                      onClick={() => showDeleteConfirmation(selectedReport)}
                      disabled={deleteLoading}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      title="Delete report"
                    >
                      {deleteLoading ? (
                        <div className="w-[18px] h-[18px] border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="p-2 text-gray-400 hover:text-white transition-all cursor-pointer active:scale-95 rounded-full hover:bg-gray-800/80 hover:rotate-90 transform duration-300"
                    title="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                {/* Meeting Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="glass-effect p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <div className="flex items-center gap-2 text-gray-300 mb-1">
                      <Users size={16} />
                      <span className="text-sm">Participants</span>
                    </div>
                    <p className="font-semibold text-white">{selectedReport.participants.length}</p>
                  </div>
                  <div className="glass-effect p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <div className="flex items-center gap-2 text-gray-300 mb-1">
                      <Clock size={16} />
                      <span className="text-sm">Duration</span>
                    </div>
                    <p className="font-semibold text-white">{formatDuration(selectedReport.durationMinutes)}</p>
                  </div>
                  <div className="glass-effect p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <div className="flex items-center gap-2 text-gray-300 mb-1">
                      <MessageSquare size={16} />
                      <span className="text-sm">Messages</span>
                    </div>
                    <p className="font-semibold text-white">{selectedReport.messageCount}</p>
                  </div>
                  <div className="glass-effect p-3 sm:p-4 rounded-lg sm:rounded-xl">
                    <div className="flex items-center gap-2 text-gray-300 mb-1">
                      <Calendar size={16} />
                      <span className="text-sm">Channel</span>
                    </div>
                    <p className="font-semibold text-white">{selectedReport.channelName}</p>
                  </div>
                </div>

                {/* Participants List */}
                {Array.isArray(selectedReport.participants) && selectedReport.participants.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Participants ({selectedReport.participants.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedReport.participants.map((participant, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 glass-effect px-3 sm:px-4 py-3 rounded-lg sm:rounded-xl"
                        >
                          {participant.photo ? (
                            <img
                              src={participant.photo}
                              alt={participant.name || "Participant"}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                              <span className="text-sm text-white font-medium">
                                {(participant.name || participant.user_name || "U").charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {participant.name || participant.user_name || "Unknown User"}
                            </p>
                            {participant.email && (
                              <p className="text-xs text-gray-400 truncate">
                                {participant.email}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">Meeting Summary</h3>
                    {canModifyReport(selectedReport) && (
                      <div className="flex items-center gap-2">
                        {!selectedReport.summary && !editingSummary && (
                          <button
                            onClick={async () => {
                              try {
                                setAiSummaryLoading(true);
                                const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
                                const response = await axios.post(
                                  `${baseURL}/api/ai/generate-summary`,
                                  {
                                    meetingData: {
                                      title: selectedReport.title,
                                      participants: selectedReport.participants,
                                      duration_minutes: selectedReport.durationMinutes,
                                      messages: selectedReport.messagesData || [],
                                      started_at: selectedReport.startedAt,
                                      ended_at: selectedReport.endedAt
                                    }
                                  },
                                  { withCredentials: true }
                                );
                                setSummaryText(response.data.summary);
                                setEditingSummary(true);
                                toast.success("AI summary generated!");
                              } catch (error) {
                                console.error("Error generating summary:", error);
                                toast.error("Failed to generate summary");
                              } finally {
                                setAiSummaryLoading(false);
                              }
                            }}
                            disabled={aiSummaryLoading}
                            className="flex items-center gap-2 px-3 py-1 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {aiSummaryLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <MessageSquare size={16} />
                                <span>Generate with AI</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setEditingSummary(!editingSummary)}
                          className="flex items-center gap-2 px-3 py-1 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit size={16} />
                          <span>{editingSummary ? "Cancel" : "Edit"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingSummary ? (
                    <div className="space-y-3">
                      <textarea
                        value={summaryText}
                        onChange={(e) => setSummaryText(e.target.value)}
                        placeholder="Add a meeting summary..."
                        className="w-full h-32 p-3 glass-effect rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-white placeholder-gray-400 bg-gray-800/30"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={updateSummary}
                          className="px-4 py-2 glass-button-enhanced text-purple-400 hover:text-purple-300 rounded-lg transition-colors cursor-pointer"
                        >
                          Save Summary
                        </button>
                        <button
                          onClick={() => {
                            setEditingSummary(false);
                            setSummaryText(selectedReport.summary || "");
                          }}
                          className="px-4 py-2 glass-button text-gray-400 hover:text-gray-300 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-effect p-4 rounded-lg sm:rounded-xl">
                      {selectedReport.summary ? (
                        <p className="text-gray-300 whitespace-pre-wrap">{selectedReport.summary}</p>
                      ) : (
                        <p className="text-gray-400 italic">No summary available</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Chat Messages */}
                {selectedReport.messagesData && selectedReport.messagesData.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Chat Messages</h3>
                    <div className="glass-effect rounded-lg sm:rounded-xl p-4 max-h-96 overflow-y-auto messages-smooth-scroll">
                      <div className="space-y-3">
                        {selectedReport.messagesData.map((message, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex-shrink-0">
                              {message.user_photo ? (
                                <img
                                  src={message.user_photo}
                                  alt={message.user_name}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                                  <span className="text-xs text-white font-medium">
                                    {message.user_name?.charAt(0).toUpperCase() || "U"}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white">
                                  {message.user_name || "Unknown User"}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(message.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDeleteReport}
        title="Delete Meeting Report"
        message={`Are you sure you want to delete the meeting report "${reportToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Report"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default MeetingReports;