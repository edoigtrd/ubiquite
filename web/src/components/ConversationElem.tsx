import { Icon } from "@iconify/react";

type Props = {
  content: string;
  onClick?: () => void;
  uuid?: string;
  onDelete?: () => void;
};

export default function ConversationElem({ content, onClick, onDelete }: Props) {
  return (
    <div className="w-full" onClick={onClick}>
      <div className="relative group w-full rounded-2xl p-4 pr-12 border bg-[#1b1d22] border-white/10 text-neutral-300">
        {content}

        <Icon
          icon="iconoir:trash"
          className="absolute right-3 inset-y-0 my-auto w-7 h-7 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
        />
      </div>
    </div>
  );
}
