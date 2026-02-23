import { Link } from 'react-router-dom';

const ButtonLink = ({ children, to }) => {
  return (
    <Link to={to} className="bg-black hover:bg-slate-950 text-white w-full m-1 py-2 flex justify-center rounded" >
      {children}
    </Link>
  );
};

export default ButtonLink;