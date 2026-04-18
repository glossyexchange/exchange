import React from "react";
import { Link } from "react-router-dom";

interface StatCardProps {
  color: string;
  title: string;
  link: string;
  img: string;
  textColor: string;
}

const CardLink: React.FC<StatCardProps> = ({ color, title, img, link, textColor }) => {
  return (
    <Link to={link} className="border-b pb-5">
      <div className="flex flex-col rounded-2xl   bg-white shadow-md transition-all duration-200 hover:shadow-lg cursor-pointer h-full">
        {/* Colored header section */}
        <div className={`flex items-center justify-center ${color} w-full rounded-t-2xl  border-b shadow-md transition-all duration-200`}>
          <p className={`p-3 text-md ${textColor} font-medium`}>{title}</p>
        </div>
        
        {/* Content section with image */}
        <div className="flex-grow bg-white hover:bg-slate-100 rounded-b-2xl p-3 flex items-center justify-center min-h-[90px]">
          <div className="flex items-center justify-center w-full h-full">
            <img 
              src={img} 
              alt={title} 
              className="w-16 h-16 object-contain" 
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CardLink;