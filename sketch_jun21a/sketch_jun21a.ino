#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "feeya";
const char* password = "piaaaaa000";

// Server configuration
const char* websocket_server = "pick-n-go.fly.dev"; // Fly.io server host
const int websocket_port = 443;   
const char* websocket_path = "/ws/esp32/ESP32_MAIN";

// Pin definitions - Sila ubah mengikut sambungan fizikal anda
const int SOLENOID_PIN_1 = 26; 
const int SOLENOID_PIN_2 = 27;
const int SOLENOID_PIN_3 = 25; 

WebSocketsClient webSocket;

// Fungsi untuk membuka locker
void openLocker(int lockerID) {
    int pinToTrigger = 0;
    
    if (lockerID == 1) pinToTrigger = SOLENOID_PIN_1;
    else if (lockerID == 2) pinToTrigger = SOLENOID_PIN_2;
    else if (lockerID == 3) pinToTrigger = SOLENOID_PIN_3;

    if (pinToTrigger != 0) {
        Serial.printf("Opening Locker %d on pin %d\n", lockerID, pinToTrigger);
        digitalWrite(pinToTrigger, HIGH); // Jika relay 'Active High'
        delay(3000); 
        digitalWrite(pinToTrigger, LOW);
        Serial.printf("Locker %d closed.\n", lockerID);
    }
}

// Fungsi untuk mengunci locker (Relay Active High)
void lockLocker(int lockerID) {
    int pinToTrigger = 0;
    
    if (lockerID == 1) pinToTrigger = SOLENOID_PIN_1;
    else if (lockerID == 2) pinToTrigger = SOLENOID_PIN_2;
    else if (lockerID == 3) pinToTrigger = SOLENOID_PIN_3;

    if (pinToTrigger != 0) {
        Serial.printf("Locking Locker %d on pin %d\n", lockerID, pinToTrigger);
        digitalWrite(pinToTrigger, LOW); // LOW to lock (Relay OFF for Active High)
        Serial.printf("Locker %d locked instantly.\n", lockerID);
    }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("[WSc] Disconnected!\n");
            break;
        case WStype_CONNECTED:
            Serial.printf("[WSc] Connected to server\n");
            break;
        case WStype_TEXT: {
            Serial.printf("[WSc] Received: %s\n", payload);
            
            StaticJsonDocument<200> doc;
            DeserializationError error = deserializeJson(doc, payload);
            
            if (!error) {
                const char* action = doc["action"];
                int lockerID = doc["lockerID"];
                
                if (strcmp(action, "OPEN") == 0) {
                    openLocker(lockerID);
                } else if (strcmp(action, "LOCK") == 0) {
                    lockLocker(lockerID);
                }
            }
            break;
        }
        default: break;
    }
}

void setup() {
    Serial.begin(115200);
    
    // Set semua pin sebagai output
    pinMode(SOLENOID_PIN_1, OUTPUT);
    pinMode(SOLENOID_PIN_2, OUTPUT);
    pinMode(SOLENOID_PIN_3, OUTPUT);
    
    digitalWrite(SOLENOID_PIN_1, LOW);
    digitalWrite(SOLENOID_PIN_2, LOW);
    digitalWrite(SOLENOID_PIN_3, LOW);

    // Sambung ke WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");

    // Setup WebSocket
    webSocket.begin(websocket_server, websocket_port, websocket_path);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
}

void loop() {
    webSocket.loop();
}