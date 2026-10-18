using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TesteSignalR.Hubs
{
    [Authorize]
    public class IotComms : Hub
    {
        private const string GrupoDispositivos = "devices";
        private const string GrupoMonitores = "monitors";

        private readonly DeviceRegistry _registry;

        public IotComms(DeviceRegistry registry) => _registry = registry;

        private string Id => Context.UserIdentifier!;
        private bool EhMonitor => Id == "monitor";

        public async Task SendSignal(bool pressed)
        {
            var state = _registry.SetPressed(Id, pressed);

            // Dispositivos acionam o buzzer; monitores so acompanham.
            await Clients.OthersInGroup(GrupoDispositivos).SendAsync("ReceiveSignal", Id, pressed);
            await Clients.Group(GrupoMonitores).SendAsync("DeviceChanged", state);
        }

        public string HeartBeat(long uptime)
        {
            _registry.Touch(Id);
            return $"ok {uptime}";
        }

        public IReadOnlyCollection<DeviceState> GetDevices() => _registry.All();

        public override async Task OnConnectedAsync()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId,
                EhMonitor ? GrupoMonitores : GrupoDispositivos);

            if (!EhMonitor)
            {
                var state = _registry.Connect(Id);
                await Clients.Group(GrupoMonitores).SendAsync("DeviceChanged", state);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (!EhMonitor)
            {
                var state = _registry.Disconnect(Id);

                // Trava de seguranca: se o dispositivo caiu com o botao pressionado,
                // ninguem mais vai mandar o "soltou".
                await Clients.OthersInGroup(GrupoDispositivos).SendAsync("ReceiveSignal", Id, false);
                await Clients.Group(GrupoMonitores).SendAsync("DeviceChanged", state);
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
