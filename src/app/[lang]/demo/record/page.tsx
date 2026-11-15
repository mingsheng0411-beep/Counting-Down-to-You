import { DemoReel } from "@/features/demo/demo-reel";

/**
 * The demo reel at half speed, for the recording script: it grabs frames
 * while this plays and then speeds the result back up, which doubles how
 * many frames each second of the finished video is made from.
 */
export default function DemoRecordPage() {
  return <DemoReel slow={2} />;
}
