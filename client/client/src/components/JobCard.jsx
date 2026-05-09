import PropTypes from "prop-types";
import { FiArrowRight, FiCalendar } from "react-icons/fi";
import default_avatar from "../assets/default_avatar.svg";
import { Link } from "react-router";

function JobCard({ jobData }) {
    const {
        title = "Project Title",
        status = "open",
        postedBy = {},
        tags = [],
        hourlyRate = 0,
        _id = "",
        createdAt = new Date(), // Fallback
    } = jobData;

    const postedByName = `${postedBy?.name?.firstName || "Client"} ${postedBy?.name?.lastName || ""}`.trim();
    const postedById = postedBy?._id || "";
    const postedByAvatar = postedBy?.avatar || default_avatar;

    const statusStyles = {
        open: "bg-emerald-50 text-emerald-600 border-emerald-100 badge-icon-open",
        closed: "bg-red-50 text-red-600 border-red-100 badge-icon-closed",
        finished: "bg-blue-50 text-blue-600 border-blue-100 badge-icon-finished",
        completed: "bg-teal-50 text-teal-600 border-teal-100 badge-icon-completed",
        paid: "bg-emerald-100 text-emerald-800 border-emerald-200 badge-icon-paid",
        in_progress: "bg-amber-50 text-amber-600 border-amber-100 badge-icon-progress",
    };

    const statusIcons = {
        open: "🟢",
        closed: "🔴",
        finished: "🔵",
        completed: "✅",
        paid: "💰",
        in_progress: "⏳",
    };

    return (
        <div className="group w-80 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col relative">
            {/* Subtle Top Accent */}
            <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/40"></div>

            <div className="p-5 space-y-4 flex-1 flex flex-col">
                {/* Header: Client and Status */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200">
                            <img
                                src={postedByAvatar}
                                alt={postedByName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Posted by</span>
                            <Link to={postedById ? `/profile/${postedById}` : "#"} className="text-xs font-semibold text-slate-700 hover:text-primary transition-colors truncate">
                                {postedByName}
                            </Link>
                            <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-0.5">
                                <FiCalendar className="text-[8px]" />
                                <span>{new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                    
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-semibold border whitespace-nowrap flex items-center gap-1 ${statusStyles[status] || statusStyles.closed}`}>
                        <span className="text-xs">{statusIcons[status]}</span>
                        {status.replace(/_/g, " ")}
                    </span>
                </div>

                {/* Project Title */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {title}
                    </h3>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                    {tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[8px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-150 hover:border-slate-300 transition-colors">
                            #{tag}
                        </span>
                    ))}
                    {tags.length > 3 && (
                        <span className="text-[8px] font-semibold text-slate-400 py-1">+{tags.length - 3}</span>
                    )}
                </div>

                {/* Price and Action */}
                <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-semibold text-slate-500 uppercase">Rate</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-lg font-bold text-slate-900">Rs. {hourlyRate}</span>
                            <span className="text-[9px] font-semibold text-slate-400">/hr</span>
                        </div>
                    </div>

                    <Link to={`/jobs/${_id}`}>
                        <button className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md">
                            Apply
                            <FiArrowRight className="text-xs" />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

JobCard.propTypes = {
    jobData: PropTypes.shape({
        title: PropTypes.string,
        status: PropTypes.oneOf(["open", "closed", "finished", "in_progress", "completed", "paid"]),
        postedBy: PropTypes.shape({
            avatar: PropTypes.string,
            name: PropTypes.shape({
                firstName: PropTypes.string,
                lastName: PropTypes.string,
            }),
        }),
        tags: PropTypes.arrayOf(PropTypes.string),
        hourlyRate: PropTypes.number,
        _id: PropTypes.string,
    }),
};

export default JobCard;
