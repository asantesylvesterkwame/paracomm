import { toast } from "sonner";

type NotifyType = "success" | "error" | "info" | "warning";

export const notify = ({
  type,
  message,
  description,
}: {
  type: NotifyType;
  message: string;
  description?: string;
}) => {
  toast[type](message, { description });
};

export const handleError = (error: any) => {
  let errorMessage = "An unexpected error occurred.";
  if (error.response) {
    if (error.response.data?.errors?.length > 0) {
      const first = error.response.data.errors[0];
      errorMessage = first.message || first.msg;
    } else {
      errorMessage =
        error.response.data.message ||
        error.response.data ||
        error.response.statusText;
    }
  } else if (error.request) {
    errorMessage = "No response received from the server.";
  } else if (error.code === "ERR_NETWORK") {
    errorMessage = "No Internet Connection. Please check your internet.";
  } else if (error.code === "ECONNABORTED") {
    errorMessage = "Network Timeout. Please check your internet.";
  } else {
    errorMessage = error.message;
  }
  return errorMessage;
};

export const handleApiAction = async ({
  action,
  secondaryAction,
  onSuccess,
  onSecondarySuccess,
  onError,
  setLoading,
  errorMessage,
  isResponseLogged,
  isToastDisabled,
}: {
  action: () => Promise<any> | void;
  secondaryAction?: () => Promise<any>;
  onSuccess: (response: any) => void;
  onSecondarySuccess?: (response: any) => void;
  onError?: (error: any) => void;
  setLoading: (loading: boolean) => void;
  errorMessage: string;
  isResponseLogged?: boolean;
  isToastDisabled?: boolean;
}) => {
  setLoading(true);
  let response: any;
  let secondaryResponse: any;
  let succeeded = false;
  try {
    response = await action();
    if (response && isResponseLogged) {
      console.log(response?.data);
    }
    if (secondaryAction) {
      secondaryResponse = await secondaryAction();
    }
    succeeded = true;
  } catch (error: any) {
    if (!isToastDisabled) {
      toast.error(handleError(error) || errorMessage || "Something Went Wrong", {
        description: errorMessage,
        action: {
          label: "Try Again",
          onClick: () =>
            handleApiAction({
              action,
              secondaryAction,
              onSuccess,
              onSecondarySuccess,
              setLoading,
              errorMessage,
            }),
        },
      });
    }
    if (onError) onError(error);
  } finally {
    setLoading(false);
  }
  if (succeeded) {
    onSuccess(response);
    if (secondaryAction && onSecondarySuccess) {
      onSecondarySuccess(secondaryResponse);
    }
  }
};

export const formatTimeAgo = (value: string | number | Date) => {
  const then = new Date(value).getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};
