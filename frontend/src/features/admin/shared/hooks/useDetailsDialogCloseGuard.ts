import { useState } from "react";

interface DetailsDialogCloseGuard {
  isClosing: boolean;
  markClosing: () => void;
  handleOpenChange: (open: boolean) => void;
}

export const useDetailsDialogCloseGuard = (
  onOpenChange: (open: boolean) => void,
): DetailsDialogCloseGuard => {
  const [isClosing, setIsClosing] = useState(false);

  const markClosing = () => setIsClosing(true);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setIsClosing(false);
    onOpenChange(nextOpen);
  };

  return { isClosing, markClosing, handleOpenChange };
};
