using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
using TesteSignalR.Hubs;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();
builder.Services.AddSignalR();
builder.Services.AddSingleton<DeviceRegistry>();

// O dashboard roda em outra origem (Vite). SignalR exige AllowCredentials, que e
// incompativel com AllowAnyOrigin, entao cada origem precisa ser aprovada uma a uma.
// Aceita qualquer porta local para nao quebrar quando o Vite cai na 5174.
builder.Services.AddCors(o => o.AddPolicy("dashboard", p => p
    .SetIsOriginAllowed(origem =>
        Uri.TryCreate(origem, UriKind.Absolute, out var uri) &&
        (uri.Host == "localhost" || uri.Host == "127.0.0.1"))
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

var chave = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(chave),
        ValidateIssuer = false,
        ValidateAudience = false
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = ctx =>
        {
            var token = ctx.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(token) && ctx.HttpContext.Request.Path.StartsWithSegments("/iot")) ctx.Token = token;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

// app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("dashboard");

app.UseAuthentication();

app.UseAuthorization();

app.MapStaticAssets();
app.MapHub<IotComms>("/iot");
app.MapRazorPages()
   .WithStaticAssets();

app.MapGet("/status", () =>
{
    return "Alive";
});

app.MapPost("/auth", (AuthRequest req, IConfiguration config) =>
{
    var esperada = config[$"Devices:{req.DeviceId}"];
    if (esperada is null || !ChavesConferem(esperada, req.DeviceKey)) return Results.Unauthorized();

    var credenciais = new SigningCredentials(new SymmetricSecurityKey(chave), SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(claims: [new Claim(JwtRegisteredClaimNames.Sub, req.DeviceId)], expires: DateTime.UtcNow.AddHours(1), signingCredentials: credenciais);

    return Results.Ok(new
    {
        token = new JwtSecurityTokenHandler().WriteToken(token),
        expiraEmSegundos = 3600
    });
});

app.Run();

static bool ChavesConferem(string a, string b) =>
CryptographicOperations.FixedTimeEquals(
    Encoding.UTF8.GetBytes(a), Encoding.UTF8.GetBytes(b));

record AuthRequest(string DeviceId, string DeviceKey);
