const StarBorder = ({
  as: Component = "button",
  className = "",
  color = "white",
  speed = "6s",
  children,
  ...rest
}) => {
  return (
    <>
      <style>
        {`
  @keyframes star-movement-bottom {
    0% { transform: translate(0%, 0%); opacity: 1; }
    100% { transform: translate(-100%, 0%); opacity: 0; }
  }

  @keyframes star-movement-top {
    0% { transform: translate(0%, 0%); opacity: 1; }
    100% { transform: translate(100%, 0%); opacity: 0; }
  }

  .animate-star-movement-bottom {
    animation: star-movement-bottom 6s linear infinite alternate;
  }

  .animate-star-movement-top {
    animation: star-movement-top 6s linear infinite alternate;
  }
`}
      </style>
      <Component
        className={`relative inline-block py-[1px] overflow-hidden rounded-[20px] ${className}`}
        {...rest}
      >
        <div
          className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
          style={{
            background: `radial-gradient(circle, ${color}, transparent 10%)`,
            animationDuration: speed,
          }}
        ></div>
        <div
          className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
          style={{
            background: `radial-gradient(circle, ${color}, transparent 10%)`,
            animationDuration: speed,
          }}
        ></div>
        <div className="relative z-1 bg-gradient-to-b from-black to-gray-900 border border-gray-800 text-white text-center text-[16px] py-[16px] px-[26px] rounded-[20px]">
          {children}
        </div>
      </Component>
    </>
  );
};

export default StarBorder;


