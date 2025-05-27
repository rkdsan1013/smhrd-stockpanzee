import React from "react";

type IconProps = {
  name: string;
  className?: string;
};

const Icons: React.FC<IconProps> = ({ name, className }) => {
  const iconMap: Record<string, React.ReactElement> = {
    user: (
      <svg
        className={className || "w-6 h-6 text-gray-800 dark:text-white"}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          strokeWidth="2"
          d="M7 17v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3Zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    ),
    close: (
      <svg
        className={className || "w-6 h-6 text-gray-800 dark:text-white"}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18 17.94 6M18 18 6.06 6"
        />
      </svg>
    ),
  };

  if (!iconMap[name]) {
    console.error(`Icon "${name}" not found.`);
    return null;
  }
  return iconMap[name];
};

export default Icons;
