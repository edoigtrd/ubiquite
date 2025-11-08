import { submitFollowup } from "@/signals/followup";


type Props = {
  action: string;
  text: string;
  parent?: string;
};

export default function FollowupBlock({ action, text, parent }: Props) {
  return (
    <span
      onClick={() => {
        submitFollowup({ parent: parent || "", content: action });
      }}
      title={action}
      className="
        relative inline-block cursor-pointer
        text-purple-300
        px-0.5
        transition-all
        hover:text-purple-100
        hover:bg-purple-500/10
        underline underline-offset-2 decoration-purple-500/60
        hover:decoration-purple-300
      "
    >
      {text}
    </span>
  );
}
