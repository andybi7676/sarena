import { Chatbox, Recorder, CustomAudioPlayer } from "./index";


export default function HumanMachineInterface() {
  return (
    <div class="max-w-full flex items-center flex-col min-h-screen p-8">
      <div class="w-1/2 h-4/5 flex items-center flex-col bg-gray-800 m-1 p-4 rounded-xl">
        <Chatbox />
        <Recorder />
        {/* <CustomAudioPlayer /> */}
      </div>
    </div>
  )
}
