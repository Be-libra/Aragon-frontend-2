"use client";

import { useState } from "react";

export type ModalState<TData> = {
  isOpen: boolean;
  data: TData | null;
};

export function useModal<TData = undefined>(initialData: TData | null = null) {
  const [state, setState] = useState<ModalState<TData>>({
    isOpen: false,
    data: initialData
  });

  function open(data?: TData) {
    setState({
      isOpen: true,
      data: data ?? null
    });
  }

  function close() {
    setState((current) => ({
      ...current,
      isOpen: false
    }));
  }

  function setData(data: TData | null) {
    setState((current) => ({
      ...current,
      data
    }));
  }

  function reset() {
    setState({
      isOpen: false,
      data: initialData
    });
  }

  return {
    ...state,
    open,
    close,
    setData,
    reset
  };
}
