using System.Collections.Concurrent;

namespace TesteSignalR.Hubs
{
    public record DeviceState(string Id, bool Online, bool Pressed, DateTimeOffset LastSeen);

    /// <summary>
    /// Estado dos dispositivos conectados. Singleton: vive enquanto o processo viver.
    /// </summary>
    public class DeviceRegistry
    {
        private readonly ConcurrentDictionary<string, DeviceState> _devices = new();

        public DeviceState Connect(string id)
        {
            var state = new DeviceState(id, Online: true, Pressed: false, DateTimeOffset.UtcNow);
            _devices[id] = state;
            return state;
        }

        public DeviceState Disconnect(string id)
        {
            var state = new DeviceState(id, Online: false, Pressed: false, DateTimeOffset.UtcNow);
            _devices[id] = state;
            return state;
        }

        public DeviceState SetPressed(string id, bool pressed)
        {
            var state = new DeviceState(id, Online: true, pressed, DateTimeOffset.UtcNow);
            _devices[id] = state;
            return state;
        }

        public DeviceState Touch(string id)
        {
            var atual = _devices.GetValueOrDefault(id);
            var state = new DeviceState(id, Online: true, atual?.Pressed ?? false, DateTimeOffset.UtcNow);
            _devices[id] = state;
            return state;
        }

        public IReadOnlyCollection<DeviceState> All() => _devices.Values.ToArray();
    }
}
