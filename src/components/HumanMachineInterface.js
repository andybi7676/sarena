import { Chatbox, Recorder, CustomAudioPlayer } from "./index";


export default function HumanMachineInterface() {
  return (
    <div class="max-w-full flex items-center flex-col border-2">
      <div class="w-1/3 flex items-center flex-col border-2 m-1 p-2">
        <Chatbox />
        <Recorder />
        <CustomAudioPlayer />
      </div>
    </div>
  )
}
