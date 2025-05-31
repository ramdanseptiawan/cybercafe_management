const ContentArea = ({ children, isMobile }) => {
  return (
    <main className={`flex-1 overflow-auto ${isMobile ? 'pb-20' : 'p-6'} bg-gray-50`}>
      {children}
    </main>
  );
};

export default ContentArea;