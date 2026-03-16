import React from 'react';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="flex space-x-2">
        <div className="w-4 h-4 bg-accent rounded-full animate-bounce"></div>
        <div className="w-4 h-4 bg-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
        <div className="w-4 h-4 bg-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
      </div>
      <h2 className="mt-4 text-xl font-bold text-primary animate-pulse">Apna Rooms</h2>
    </div>
  );
};

export default Loader;
