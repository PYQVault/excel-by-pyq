import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import logoImg from "@/assets/logo.png";
import clsx from "clsx";

// size: 'sm' | 'md' | 'lg'
const Logo = ({
  size = "md",
  clickable = true,
  showText = true,
  className = "",
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const sizes = {
    sm: { img: "w-8 h-8", text: "text-base" },
    md: { img: "w-12 h-12", text: "text-lg" },
    lg: { img: "w-16 h-16", text: "text-2xl" },
  };

  const handleClick = () => {
    if (!clickable) return;
    navigate(user ? "/dashboard" : "/");
  };

  return (
    <div
      onClick={handleClick}
      className={clsx(
        "flex items-center gap-2.5",
        clickable && "cursor-pointer",
        className,
      )}
    >
      {/* Logo image */}
      <img
        src={logoImg}
        alt="Excel By PYQ Logo"
        className={clsx(
          sizes[size].img,
          "object-contain rounded-lg shrink-0",
        )}
      />

      {/* App name */}
      {showText && (
        <span
          className={clsx(
            "font-extrabold leading-none text-slate-800 dark:text-slate-100",
            sizes[size].text,
          )}
        >
          <span className="bg-linear-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
            Excel By PYQ
          </span>
        </span>
      )}
    </div>
  );
};

export default Logo;
