import Chatbox from "./Chatbox"
import Recorder from "./Recorder"


export default function HumanMachineInterface() {
  return (
    <div className="max-w-full flex items-center flex-col min-h-screen p-8">
      <div className="w-2/3 flex items-center flex-col bg-gray-800 m-1 p-4 rounded-xl">
        <Chatbox />
        <Recorder />
        {/* <CustomAudioPlayer /> */}
      </div>
    </div>
      
  )
}
