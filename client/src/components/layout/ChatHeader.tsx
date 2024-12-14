import { BiArrowBack } from 'react-icons/bi';

interface User {
  profileImage: string;
  name: string;
}

interface ChatHeaderProps {
  user: User;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ user }) => {
  const handleBack = () => {
    // Logic to go back to the previous screen
    window.history.back();
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <button 
        onClick={handleBack} 
        className="md:hidden text-gray-600 dark:text-gray-300"
      >
        <BiArrowBack className="text-2xl" />
      </button>
      
      <div className="flex items-center">
        <img
          src={user.profileImage}
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover mr-3"
        />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{user.name}</h2>
      </div>
    </header>
  );
};

export default ChatHeader;
