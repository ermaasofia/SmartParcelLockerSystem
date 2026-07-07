#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "feeya";
const char* password = "piaaaaa000";

// Server configuration
const char* websocket_server = "pick-n-go.fly.dev"; // Fly.io server host
const int websocket_port = 443;                     // HTTPS/WSS port
const char* websocket_path = "/ws/esp32/ESP32_MAIN";

// Definisi Pin GPIO mengikut pendawaian fizikal anda (2 Locker)
const int SOLENOID_PIN_1 = 26; 
const int SOLENOID_PIN_2 = 27; 

WiFiClientSecure secureClient;
WebSocketsClient webSocket;

// Fungsi untuk membuka locker (Logik diganti ke Active Low)
void openLocker(int lockerID, int durationMs = 20000) {
    int pinToTrigger = 0;
    
    if (lockerID == 1) pinToTrigger = SOLENOID_PIN_1;
    else if (lockerID == 2) pinToTrigger = SOLENOID_PIN_2;

    if (pinToTrigger != 0) {
        Serial.printf("Command received: Open locker %d on pin %d for %d ms\n", lockerID, pinToTrigger, durationMs);
        
        // PENTING: Relay Active Low memerlukan 'LOW' untuk ON (buka kunci)
        digitalWrite(pinToTrigger, LOW); 
        Serial.println("Relay triggered (ON)");
        
        delay(durationMs); // Biarkan solenoid terbuka selama tempoh yang ditetapkan
        
        // Guna 'HIGH' untuk OFF (kunci semula)
        digitalWrite(pinToTrigger, HIGH); 
        Serial.printf("Locker %d closed (OFF).\n", lockerID);
    }
}

// Fungsi untuk mengunci locker secara serta-merta (Relay Active Low)
void lockLocker(int lockerID) {
    int pinToTrigger = 0;
    
    if (lockerID == 1) pinToTrigger = SOLENOID_PIN_1;
    else if (lockerID == 2) pinToTrigger = SOLENOID_PIN_2;

    if (pinToTrigger != 0) {
        Serial.printf("Command received: Lock locker %d on pin %d\n", lockerID, pinToTrigger);
        digitalWrite(pinToTrigger, HIGH); // Guna 'HIGH' untuk OFF (kunci semula / kekal kunci)
        Serial.printf("Locker %d locked instantly.\n", lockerID);
    }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("[WSc] Disconnected!\n");
            break;
        case WStype_CONNECTED:
            Serial.printf("[WSc] Connected to url: %s\n", payload);
            break;
        case WStype_TEXT: {
            Serial.printf("[WSc] get text: %s\n", payload);
            
            StaticJsonDocument<200> doc;
            DeserializationError error = deserializeJson(doc, payload);
            
            if (error) {
                Serial.print(F("deserializeJson() failed: "));
                Serial.println(error.f_str());
                return;
            }
            
            const char* action = doc["action"];
            int lockerID = doc["lockerID"];
            
            if (strcmp(action, "OPEN") == 0) {
                if (doc.containsKey("duration")) {
                    int duration = doc["duration"];
                    openLocker(lockerID, duration);
                } else {
                    openLocker(lockerID); // Defaults to 20000ms
                }
            } else if (strcmp(action, "LOCK") == 0) {
                lockLocker(lockerID);
            }
            break;
        }
        default:
            break;
    }
}

void setup() {
    Serial.begin(115200);
    
    // Initialize pins sebagai OUTPUT
    pinMode(SOLENOID_PIN_1, OUTPUT);
    pinMode(SOLENOID_PIN_2, OUTPUT);
    
    // PENTING: Untuk Active Low, mulakan dengan 'HIGH' supaya kunci sentiasa tertutup semasa 'boot up'
    digitalWrite(SOLENOID_PIN_1, HIGH);
    digitalWrite(SOLENOID_PIN_2, HIGH);

    // Sambung ke WiFi
    Serial.println();
    Serial.print("Connecting to ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("\nWiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    // Memulakan sambungan WebSocket (Secure WSS)
    secureClient.setInsecure(); // Bypass CA certificate verification for ease of setup
    webSocket.beginSslWithCA(websocket_server, websocket_port, websocket_path, NULL);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
}

void loop() {
    webSocket.loop();
}