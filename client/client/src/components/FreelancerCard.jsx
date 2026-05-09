import { useEffect, useState } from "react";
import api from "../utils/api";
import { FiArrowRight, FiCheckCircle, FiClock, FiStar } from "react-icons/fi";
import default_avatar from "../assets/default_avatar.svg";
import { Link } from "react-router";
import capitalize from "../utils/capitalize";

function FreelancerCard({ userData, recommendationReasons = [], matchedProjectTitle = "", onInvite, inviteLabel = "Invite" }) {
    const {
        avatar,
        rating = 0,
        name = {},
        kycVerified,
        available,
        tags = [],
        hourlyRate,
        _id,
    } = userData;

    const firstName = capitalize(name.firstName || "Freelancer");
    const lastName = capitalize(name.lastName || "");
    const [displayRating, setDisplayRating] = useState(Number(rating || 0));

    useEffect(() => {
        let isActive = true;

        const fetchRating = async () => {
            if (!_id) {
                return;
            }

            try {
                const response = await api.get(`/reviews/rating/${_id}`);
                const averageRating = Number(response.data?.data?.averageRating || 0);
                if (isActive) {
                    setDisplayRating(averageRating);
                }
            } catch (error) {
                if (isActive) {
                    setDisplayRating(Number(rating || 0));
                }
            }
        };

        fetchRating();

        return () => {
            isActive = false;
        };
    }, [_id, rating]);

    return (
        <div className="group w-72 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 overflow-hidden flex flex-col relative">
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-200">
                <FiStar className="fill-current" />
                <span>{displayRating.toFixed(1)}</span>
            </div>
            {/* Top Branding Strip */}
            <div className="h-2 bg-gradient-to-r from-primary to-indigo-600 w-0 group-hover:w-full transition-all duration-700"></div>
            
            <div className="p-6 space-y-5 flex-1 flex flex-col">
                {/* Profile Header */}
                <div className="flex items-start justify-between">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-50 shadow-sm group-hover:shadow-md transition-shadow">
                            <img
                                src={avatar || default_avatar}
                                alt={firstName}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                            />
                        </div>
                        {kycVerified && (
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                <FiCheckCircle className="text-primary text-sm fill-primary/10" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-end pt-10">
                        <span className={`text-[10px] font-black uppercase tracking-widest mt-2 ${available ? 'text-emerald-500' : 'text-red-400'}`}>
                            {available ? 'Available Now' : 'Busy'}
                        </span>
                    </div>
                </div>

                {/* Info Section */}
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">
                        {firstName} {lastName}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                        <FiClock className="text-xs" />
                        <span>Active 2h ago</span>
                    </div>
                    {matchedProjectTitle && (
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Matched project: <span className="text-slate-900">{matchedProjectTitle}</span>
                        </div>
                    )}
                    {recommendationReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                            {recommendationReasons.slice(0, 2).map((reason) => (
                                <span key={reason} className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-2 py-1 rounded-md">
                                    {reason}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Skills Section */}
                <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-md">
                            {tag}
                        </span>
                    ))}
                    {tags.length > 3 && (
                        <span className="text-[10px] font-bold text-gray-400 py-1">+{tags.length - 3}</span>
                    )}
                </div>

                {/* Bottom Stats & Action */}
                <div className="pt-4 border-t border-gray-50 mt-auto flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rate</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-gray-900">Rs. {hourlyRate}</span>
                            <span className="text-[10px] font-bold text-gray-400">/hr</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onInvite && (
                            <button
                                onClick={onInvite}
                                className="px-3 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                            >
                                {inviteLabel}
                            </button>
                        )}
                        <Link to={`/profile/${_id}`}>
                            <button className="p-3 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                <FiArrowRight className="text-xl" />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FreelancerCard;
