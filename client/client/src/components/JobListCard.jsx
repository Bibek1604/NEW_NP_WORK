import React from "react";
import { Link } from "react-router";
import capitalize from "../utils/capitalize";

function JobListCard({ jobId, jobtitle, amount, freelancer, status }) {
    const statusStyles = {
        open: "bg-primary text-whitetext",
        closed: "bg-red-500 text-whitetext",
        finished: "bg-gray-500 text-whitetext",
        in_progress: "bg-gray-500 text-whitetext",
        completed: "bg-emerald-500 text-white",
        paid: "bg-emerald-500 text-white",
    };
    
    const isCompleted = ["completed", "finished", "paid"].includes(status);
    
    return (
        <Link
            to={`/jobs/${jobId}`}
            className="flex justify-between items-center w-[740px] py-3 px-3 border-b border-[#eeeeee] cursor-pointer hover:bg-secondary rounded-lg group"
        >
            <div className="flex justify-between items-center w-full mx-auto">
                <div className="flex w-[24%]">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-blacktext text-sm font-medium">
                            {jobtitle}
                        </h2>
                        {isCompleted && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded w-fit font-semibold">
                                ✓ Completed
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex w-[24%]">
                    <h2 className="text-blacktext text-sm font-medium">
                        Rs.{amount}
                    </h2>
                </div>
                <div className="flex w-[24%]">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-blacktext text-sm font-medium">
                            {!freelancer
                                ? "Not accepted"
                                : capitalize(freelancer.name?.firstName || freelancer.firstName || "")}
                        </h2>
                        {freelancer && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded w-fit font-semibold">
                                👤 Assigned
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex w-[24%] justify-center">
                    <h2
                        className={`text-sm font-medium px-3 py-1 rounded ${statusStyles[status] || "Error"}`}
                    >
                        {status === "in_progress"
                            ? "In Progress"
                            : status === "open"
                              ? "Open"
                              : status === "closed"
                                ? "Closed"
                                : status === "finished"
                                  ? "Finished"
                                  : status === "completed"
                                    ? "Completed"
                                    : status === "paid"
                                      ? "Paid"
                                      : status}
                    </h2>
                </div>
            </div>
        </Link>
    );
}

export default JobListCard;
