import { useState, useRef, useEffect } from "react";
import type { BaseMessageStore } from "../types";

interface UseScrollHandlerProps {
  messageStore: BaseMessageStore;
}

export function useScrollHandler({ messageStore }: UseScrollHandlerProps) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const prevMessageCount = useRef(messageStore.messages.length);
  const prevFirstMessageId = useRef(messageStore.messages[0]?.id);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const wasAtBottom = isAtBottom;
    const nowAtBottom = distanceFromBottom < 50;

    setIsAtBottom(nowAtBottom);

    if (nowAtBottom && !wasAtBottom) {
      setNewMessageCount(0);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
    setNewMessageCount(0);
  };

  // Handle message count changes
  useEffect(() => {
    const currentMessageCount = messageStore.messages.length;
    const newMessages = currentMessageCount - prevMessageCount.current;
    const currentFirstMessageId = messageStore.messages[0]?.id;

    // If first message changed, it means older messages were loaded
    if (
      prevFirstMessageId.current !== undefined &&
      prevFirstMessageId.current !== currentFirstMessageId
    ) {
      prevMessageCount.current = currentMessageCount;
      prevFirstMessageId.current = currentFirstMessageId;
      return;
    }

    // Handle new messages
    if (!messageStore.isLoadingOlder && newMessages > 0) {
      if (isAtBottom) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        setNewMessageCount(0);
      } else {
        setNewMessageCount((prev) => prev + newMessages);
      }
    }

    prevMessageCount.current = currentMessageCount;
    prevFirstMessageId.current = currentFirstMessageId;
  }, [
    messageStore.messages.length,
    isAtBottom,
    messageStore.isLoadingOlder,
    messageStore.messages,
  ]);

  // Auto-scroll on first load
  useEffect(() => {
    if (messageStore.messages.length > 0 && prevMessageCount.current === 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    }
  }, [messageStore.messages.length]);

  // Handle scroll position after loading older messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (
      container &&
      messageStore.isLoadingOlder === false &&
      previousScrollHeight.current > 0
    ) {
      const newScrollHeight = container.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      container.scrollTop = container.scrollTop + scrollDiff;
      previousScrollHeight.current = 0;
    }
  }, [messageStore.isLoadingOlder]);

  return {
    isAtBottom,
    newMessageCount,
    messagesEndRef,
    messagesContainerRef,
    previousScrollHeight,
    handleScroll,
    scrollToBottom,
  };
}
