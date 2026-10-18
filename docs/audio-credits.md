# Dźwięki w grze — 0.76

Wybrane z `E:/Projects/asteroids-sounds`: 22 przygotowane kopie OGG, mono 48 kHz, łącznie **240 162 bajty**. Zastępują 18 starych OGG oraz cztery niewykorzystywane WAV. Oryginały użytkownika pozostają bez zmian. Cztery użyte paczki mają CC0; [autorzy i podstawa licencyjna](licenses/audio-sources.md).

Mapowanie i miks: `frontend/game/systems/audioPolicy.ts`. Pliki gry: `frontend/assets/sounds/cc0/production076`. Receptura: [scripts/audio-assets.json](../scripts/audio-assets.json). [Manifest SHA-256 i pomiary po zakodowaniu](audio-assets.json).

| Efekt | Plik źródłowy | Czas kopii |
| --- | --- | --- |
| Autocannon | `sci-fi-sfx/shoot_01.ogg` | 0.167 s |
| Impuls | `sci-fi-sfx/retro_laser_01.ogg` | 0.341 s |
| Kinetic | `Black Lodge / blg_beam_01.wav` | 0.935 s |
| Patrol | `sci-fi-sfx/shoot_02.ogg` | 0.149 s |
| Lancer | `sci-fi-sfx/retro_laser_02.ogg` | 0.847 s |
| Trafienie / kolizja | `60-sci-fi-sfx/sfx_03a.ogg` | 0.382 s |
| Trafienie skały | `60-sci-fi-sfx/sfx_03b.ogg` | 0.384 s |
| Rozpad skały | `sci-fi-sfx/explosion_02.ogg` | 0.868 s |
| Zniszczenie jednostki | `sci-fi-sfx/explosion_01.ogg` | 1.013 s |
| Zebranie zasobu | `sci-fi-sfx/beep_03.ogg` | 0.152 s |
| Ukończenie celu | `sci-fi-sfx/retro_beep_06.ogg` | 0.616 s |
| Tarcza | `Black Lodge / blg_energy_field_01.wav` | 0.747 s |
| Silnik (pętla) | `sfx_loops/machine_06.ogg` | 3.131 s |
| Wydobycie (pętla) | `sci-fi-sfx/loop_machine_01.ogg` | 3.074 s |
| Naprawa (pętla) | `sfx_loops/machine_07.ogg` | 1.310 s |
| Kliknięcie | `sci-fi-sfx/terminal_01.ogg` | 0.139 s |
| Potwierdzenie | `sci-fi-sfx/beep_02.ogg` | 0.249 s |
| Odmowa | `sci-fi-sfx/retro_beep_05.ogg` | 0.597 s |
| Start wyprawy | `sci-fi-sfx/teleport_01.ogg` | 0.231 s |
| Ładowanie hipernapędu | `sci-fi-sfx/teleport_02.ogg` | 1.600 s |
| Wejście w skok | `Black Lodge / blg_alien_starship_flyby_01.wav` | 1.265 s |
| Skażenie (pętla) | `sfx_loops/alarm_02.ogg` | 0.655 s |

## Przygotowanie

`npm run audio:prepare -- E:/Projects/asteroids-sounds /sciezka/do/ffmpeg` odtwarza pliki i manifest. FFmpeg musi być dostępny; sam build gry nie wymaga FFmpeg ani folderu z oryginalnymi paczkami. Skrypt nie zapisuje do folderu źródłowego.

Usunięto cisze przed efektami, ograniczono ogony krótkich sygnałów i dodano łagodne zakończenia. Filtr 45 Hz usuwa najniższe składowe; poziomy uwzględniają szczyt i RMS. Pętle otrzymują 40 ms przenikania oraz 3 ms osłony granic. Pomiar po dekodowaniu kopii OGG sprawdza szczyty poniżej 0,9 i skok na granicy pętli poniżej 0,03.

## Przegląd całego folderu

206 nagrań: Black Lodge — 50 WAV; `60-sci-fi-sfx` — 60 OGG; `sci-fi-sfx` — 50 OGG; `sfx_loops` — 30 OGG; `Laser` — 15 MP3; `ObservingTheStar` — 1 OGG oraz projekt LMMS. Wszystkie pliki audio przeszły dekodowanie podczas przeglądu. Dwie ostatnie paczki nie mają dołączonej licencji i nie są używane w tym pakiecie. Nie dodano muzyki.

Dobór opiera się na rolach efektów, analizie parametrów, kontroli zapętleń i próbie odtwarzania WebAudio. Subiektywny balans podczas dłuższej gry pozostaje do oceny przez gracza; montaż próbek nie zastępuje odsłuchu pełnej rozgrywki.
