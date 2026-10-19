'use client';

type Props = {
  /** true → button calls history.back() instead of submitting the action */
  back?: boolean;
  action?: () => Promise<void>;
};

export default function WelcomeButton({ back, action }: Props) {
  if (back) {
    return (
      <button
        type="button"
        className="welcome-btn"
        onClick={() => window.history.back()}
      >
        Chaliye shuru karein
      </button>
    );
  }
  return (
    <form action={action}>
      <button type="submit" className="welcome-btn">
        Chaliye shuru karein
      </button>
    </form>
  );
}
