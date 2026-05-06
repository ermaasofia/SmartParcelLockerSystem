#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server configuration
const char* websocket_server = "192.168.1.XXX"; // REPLACE WITH YOUR LAPTOP/SERVER IP
const int websocket_port = 8000;
const char* websocket_path = "/ws/esp32/ESP32_MAIN";

// Pin definitions
const int SOLENOID_PIN_1 = 4;
const int SOLENOID_PIN_2 = 5;
const int DOOR_SENSOR_PIN_1 = 18; // Example for alarm trigger

WebSocketsClient webSocket;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("[WSc] Disconnected!\n");
            break;
        case WStype_CONNECTED: {
            Serial.printf("[WSc] Connected to url: %s\n", payload);
        }
            break;
        case WStype_TEXT: {
            Serial.printf("[WSc] get text: %s\n", payload);
            
            // Parse JSON
            StaticJsonDocument<200> doc;
            DeserializationError error = deserializeJson(doc, payload);
            
            if (error) {
                Serial.print(F("deserializeJson() failed: "));
                Serial.println(error.f_str());
                return;
            }
            
            const char* action = doc["action"];
            int lockerID = doc["lockerID"]; // Updated to camelCase
            
            if (strcmp(action, "OPEN") == 0) {
                Serial.printf("Command received: Open locker %d\n", lockerID);
                openLocker(lockerID);
            }
            break;
        }
        case WStype_BIN:
        case WStype_ERROR:			
        case WStype_FRAGMENT_TEXT_START:
        case WStype_FRAGMENT_BIN_START:
        case WStype_FRAGMENT:
        case WStype_FRAGMENT_FIN:
            break;
    }
}

void setup() {
    Serial.begin(115200);
    
    // Initialize pins
    pinMode(SOLENOID_PIN_1, OUTPUT);
    digitalWrite(SOLENOID_PIN_1, LOW);
    pinMode(SOLENOID_PIN_2, OUTPUT);
    digitalWrite(SOLENOID_PIN_2, LOW);
    
    pinMode(DOOR_SENSOR_PIN_1, INPUT_PULLUP);

    // Connect to WiFi
    Serial.println();
    Serial.print("Connecting to ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());

    // Server address, port, and URL path
    webSocket.begin(websocket_server, websocket_port, websocket_path);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
}

void loop() {
    webSocket.loop();
}

void openLocker(int lockerID) {
    // Add logic to pulse the correct solenoid based on lockerID
    if (lockerID == 1) {
        digitalWrite(SOLENOID_PIN_1, HIGH);
        delay(1000); // Keep open for 1 second
        digitalWrite(SOLENOID_PIN_1, LOW);
    } else if (lockerID == 2) {
        digitalWrite(SOLENOID_PIN_2, HIGH);
        delay(1000); // Keep open for 1 second
        digitalWrite(SOLENOID_PIN_2, LOW);
    }
    Serial.printf("Locker %d opened.\n", lockerID);
}

void triggerAlarm(int lockerID) {
    StaticJsonDocument<200> doc;
    doc["action"] = "ALARM_TRIGGERED";
    doc["lockerID"] = lockerID; // Updated to camelCase
    
    char jsonString[200];
    serializeJson(doc, jsonString);
    
    webSocket.sendTXT(jsonString);
    Serial.println("Alarm triggered and sent to server");
}
