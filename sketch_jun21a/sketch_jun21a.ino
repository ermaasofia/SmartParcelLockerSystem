#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h> // Required for parsing the JSON command

// --- SETTINGS ---
const char* ssid = "MHBEMR-EXT1";
const char* password = "Erma@232215";

// --- SERVER SETTINGS ---
const char* websockets_server = "192.168.68.104"; 
const uint16_t port = 8000;
const char* path = "/ws/esp32/ESP32_MAIN";

// Define your relay pin here
const int RELAY_PIN = 26; 

using namespace websockets;
WebsocketsClient client;

// --- JSON MESSAGE HANDLER ---
void onMessage(WebsocketsMessage message) {
    String payload = message.data();
    Serial.println("Received: " + payload);
    
    // 1. Create a JSON document
    StaticJsonDocument<200> doc;
    
    // 2. Parse the JSON
    DeserializationError error = deserializeJson(doc, payload);
    
    if (error) {
        Serial.print("JSON Parse failed: ");
        Serial.println(error.f_str());
        return;
    }
    
    // 3. Extract values
    const char* action = doc["action"];
    int lockerID = doc["lockerID"];
    
    // 4. Trigger logic
    if (String(action) == "OPEN") {
        Serial.print("Opening Locker ID: ");
        Serial.println(lockerID);
        
        // Trigger relay
        digitalWrite(RELAY_PIN, HIGH); 
        delay(3000); // Hold for 3 seconds
        digitalWrite(RELAY_PIN, LOW);
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, LOW);
    delay(2000); 
    Serial.println("\n--- STARTING ---");

    // 1. Force clear old WiFi settings
    WiFi.disconnect(true);
    delay(1000);
    WiFi.mode(WIFI_STA);
    
    // 2. Begin Connection
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi: ");
    Serial.println(ssid);

    // 3. Monitor Connection
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(1000);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi Connected!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nWiFi Connection Failed.");
        return; 
    }

    // 4. WebSocket Setup
    client.onMessage(onMessage);
    client.addHeader("User-Agent", "Arduino/1.0");
    client.addHeader("Connection", "Upgrade");
    client.addHeader("Upgrade", "websocket");

    Serial.print("Attempting to connect to: ");
    Serial.print(websockets_server);
    Serial.print(":");
    Serial.println(port);

    bool connected = client.connect(websockets_server, port, path);
    
    if(connected) {
        Serial.println("WebSocket Connected!");
    } else {
        Serial.println("Connection Failed!");
    }
}

void loop() {
    // client.available() checks if connection is alive
    if(client.available()) {
        client.poll();
    }
}