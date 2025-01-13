const Container = ({ children }) => {
  return (
    <div className="flex-grow mx-auto py-6 space-y-2 w-full max-w-screen-md ">
      {children}
    </div>
  );
};

export default Container;
