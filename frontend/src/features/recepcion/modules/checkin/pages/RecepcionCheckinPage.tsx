import { Navigate, useSearchParams } from "react-router-dom";

export const RecepcionCheckinPage = () => {
  const [searchParams] = useSearchParams();

  const nextParams = new URLSearchParams(searchParams);
  nextParams.set("focus", "checkin");
  const nextSearch = nextParams.toString();

  return (
    <Navigate
      replace
      to={`/recepcion/agenda${nextSearch ? `?${nextSearch}` : ""}`}
    />
  );
};

export default RecepcionCheckinPage;
