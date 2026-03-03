import { Navigate, useSearchParams } from "react-router-dom";

export const RecepcionCheckinPage = () => {
  const [searchParams] = useSearchParams();

  const nextParams = new URLSearchParams(searchParams);
  nextParams.set("focus", "checkin");

  return <Navigate replace to={`/recepcion/agenda?${nextParams.toString()}`} />;
};

export default RecepcionCheckinPage;
