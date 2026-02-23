import { useState } from "react";

interface UseTableDetailsDialogResult<T> {
  open: boolean;
  selectedItem: T | null;
  openDetails: (item: T) => void;
  closeDetails: () => void;
  setOpen: (open: boolean) => void;
}

export function useTableDetailsDialog<T>(): UseTableDetailsDialogResult<T> {
  const [open, setOpenState] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const openDetails = (item: T) => {
    setSelectedItem(item);
    setOpenState(true);
  };

  const closeDetails = () => {
    setOpenState(false);
    setSelectedItem(null);
  };

  const setOpen = (nextOpen: boolean) => {
    setOpenState(nextOpen);
    if (!nextOpen) {
      setSelectedItem(null);
    }
  };

  return {
    open,
    selectedItem,
    openDetails,
    closeDetails,
    setOpen,
  };
}
