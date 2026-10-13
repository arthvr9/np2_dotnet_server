using Microsoft.AspNetCore.SignalR;

namespace TesteSignalR.Hubs
{
    public class IotComms : Hub
    {
        public async Task SendSignal(int sender) => await Clients.Others.SendAsync("ReceiveSignal", sender);

        public string HeartBeat(long uptime)
        {
            return $"ok {uptime}";
        }

        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("CID", Context.ConnectionId);
            await base.OnConnectedAsync();
        }
    }
}
