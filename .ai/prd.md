# Dokument wymagań produktu (PRD) - WorkLog

## 1. Przegląd produktu
WorkLog to aplikacja, której celem jest dostarczenie użytkownikom prostego i skutecznego narzędzia do monitorowania czasu pracy. Aplikacja umożliwia rejestrowanie czasu poświęconego na poszczególne zadania poprzez funkcje startu i pauzy. Użytkownicy mogą tworzyć zadania, zarządzać nimi oraz przeglądać dzienne podsumowania swojej aktywności.

## 2. Problem użytkownika
Podczas pracy zdalnej lub długotrwałej pracy przy komputerze trudno jest świadomie i dokładnie kontrolować czas poświęcony na poszczególne zadania. Ręczne notowanie godzin jest niewygodne, podatne na błędy i często pomijane. Brak jednego, przejrzystego miejsca do rejestrowania czasu pracy utrudnia analizę efektywności, rozliczenia oraz planowanie kolejnych zadań. WorkLog ma na celu rozwiązanie tego problemu, oferując wygodne narzędzie do mierzenia i podsumowywania czasu pracy nad zadaniami w jednym miejscu.

## 3. Wymagania funkcjonalne
- F-01: System kont użytkowników:
  - Rejestracja za pomocą adresu e-mail i hasła.
  - Logowanie do systemu.
  - Powiązanie danych (zadania, wpisy czasowe) z kontem użytkownika.
- F-02: Zarządzanie zadaniami:
  - Tworzenie nowego zadania z nazwą i opcjonalnym opisem.
  - Edycja nazwy i opisu zadania (tylko gdy licznik czasu nie jest aktywny).
  - Manualne oznaczanie zadania jako "Ukończone", co powoduje jego archiwizację.
  - Wyświetlanie listy aktywnych zadań.
- F-03: Śledzenie czasu:
  - Uruchomienie, wstrzymanie (pauza) i zatrzymanie licznika czasu.
  - Pomiar czasu może być aktywny tylko dla jednego zadania w danym momencie.
  - Zatrzymanie licznika automatycznie tworzy wpis czasowy (sesję pracy) dla danego zadania.
- F-04: Ręczna edycja czasu:
  - Możliwość ręcznej edycji istniejących wpisów czasowych (zmiana daty, godzin i minut trwania sesji).
- F-05: Podsumowanie i historia:
  - Widok dziennego podsumowania zawierający listę zadań z łącznym czasem pracy w danym dniu oraz sumę wszystkich przepracowanych godzin.
  - Dostęp do historii pracy poprzez interfejs kalendarza, umożliwiający nawigację po poszczególnych dniach i miesiącach.
- F-06: Obsługa nieoczekiwanego zamknięcia:
  - Aplikacja po ponownym uruchomieniu wykrywa, czy licznik czasu był aktywny.
  - Użytkownik otrzymuje komunikat z opcjami: "Zatrzymaj i zapisz cały czas", "Zatrzymaj i odrzuć czas od zamknięcia aplikacji" lub "Zatrzymaj i ręcznie skoryguj czas".

## 4. Granice produktu
Następujące funkcjonalności nie wchodzą w zakres MVP i nie będą implementowane w tej wersji produktu:
- Zaawansowane wykresy i statystyki produktywności.
- Funkcje porównywania okresów pracy.
- Eksport danych do formatów zewnętrznych (np. CSV, PDF).
- Integracje z zewnętrznymi narzędziami do zarządzania projektami (np. Jira, Trello, Asana).
- Funkcje rozliczeniowe i fakturowanie.
- Automatyczne wykrywanie bezczynności użytkownika.
- System powiadomień i przypomnień (np. o włączonym liczniku).
- Sugestie dotyczące optymalizacji czasu pracy.

## 5. Historyjki użytkowników
- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji, podając jedynie mój adres e-mail i hasło, aby szybko uzyskać dostęp do jej funkcjonalności.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola na adres e-mail i hasło.
  - System waliduje poprawność formatu adresu e-mail.
  - Hasło musi spełniać minimalne wymogi bezpieczeństwa (np. długość).
  - Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany do głównego widoku aplikacji.
  - W przypadku, gdy użytkownik o podanym adresie e-mail już istnieje, wyświetlany jest odpowiedni komunikat błędu.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto przy użyciu e-maila i hasła, aby uzyskać dostęp do moich zadań i historii czasu pracy.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola na adres e-mail i hasło.
  - Po poprawnym uwierzytelnieniu użytkownik zostaje przekierowany do głównego widoku aplikacji.
  - W przypadku podania błędnych danych logowania, wyświetlany jest stosowny komunikat.

- ID: US-003
- Tytuł: Tworzenie nowego zadania
- Opis: Jako użytkownik, chcę mieć możliwość dodania nowego zadania, podając jego nazwę i opcjonalny opis, aby móc rozpocząć śledzenie czasu pracy nad nim.
- Kryteria akceptacji:
  - W interfejsie znajduje się przycisk lub formularz do dodawania nowego zadania.
  - Pole "Nazwa zadania" jest wymagane.
  - Pole "Opis" jest opcjonalne.
  - Nowo utworzone zadanie pojawia się na liście aktywnych zadań.

- ID: US-004
- Tytuł: Uruchamianie i zatrzymywanie licznika czasu
- Opis: Jako użytkownik, chcę móc uruchomić stoper dla wybranego zadania, a następnie go zatrzymać, aby system automatycznie zapisał, ile czasu poświęciłem na daną sesję pracy.
- Kryteria akceptacji:
  - Przy każdym zadaniu na liście znajduje się przycisk "Start".
  - Po kliknięciu "Start", licznik zaczyna mierzyć czas, a przycisk zmienia się na "Stop".
  - W danym momencie czas może być mierzony tylko dla jednego zadania. Próba uruchomienia drugiego licznika jest niemożliwa lub powoduje zatrzymanie poprzedniego.
  - Po kliknięciu "Stop", licznik zatrzymuje się, a system tworzy nowy wpis czasowy (sesję) powiązany z zadaniem i czasem trwania.

- ID: US-005
- Tytuł: Pauzowanie i wznawianie licznika czasu
- Opis: Jako użytkownik, chcę mieć możliwość wstrzymania (pauzy) aktywnego licznika czasu i późniejszego wznowienia go, aby móc robić przerwy bez konieczności kończenia sesji pracy.
- Kryteria akceptacji:
  - Gdy licznik jest aktywny, przycisk "Stop" jest uzupełniony o przycisk "Pauza".
  - Po kliknięciu "Pauza", licznik przestaje naliczać czas, a interfejs pokazuje status "Wstrzymano".
  - Wstrzymany licznik można wznowić za pomocą przycisku "Wznów", co powoduje kontynuację naliczania czasu.

- ID: US-006
- Tytuł: Edycja zadania
- Opis: Jako użytkownik, chcę mieć możliwość edycji nazwy i opisu zadania, aby móc poprawić ewentualne błędy lub zaktualizować informacje.
- Kryteria akceptacji:
  - Przy każdym zadaniu dostępna jest opcja "Edytuj", która otwiera modal edycyjny.
  - Modal zawiera pola do edycji nazwy i opisu zadania.
  - Edycja jest niemożliwa, jeśli dla danego zadania aktywny jest licznik czasu.
  - Zapisane zmiany są natychmiast widoczne na liście zadań.

- ID: US-007
- Tytuł: Ręczna edycja wpisów czasowych
- Opis: Jako użytkownik, który zapomniał włączyć stoper lub chce skorygować zapisany czas, chcę mieć możliwość ręcznej edycji poszczególnych sesji pracy.
- Kryteria akceptacji:
  - W modalu edycji zadania znajduje się lista wszystkich wpisów czasowych (sesji) dla tego zadania.
  - Każdy wpis na liście ma opcję "Edytuj".
  - Użytkownik może zmienić datę oraz czas trwania (godziny i minuty) danej sesji.
  - Zmiany są zapisywane i wpływają na ogólne podsumowania czasu.

- ID: US-008
- Tytuł: Archiwizacja ukończonego zadania
- Opis: Jako użytkownik, chcę móc oznaczyć zadanie jako "Ukończone", aby przenieść je do archiwum i zachować porządek na liście aktywnych zadań.
- Kryteria akceptacji:
  - Przy każdym zadaniu dostępny jest przycisk lub opcja "Ukończ".
  - Po oznaczeniu jako ukończone, zadanie znika z głównej listy aktywnych zadań.
  - Ukończenie zadania jest akcją manualną i niezależną od zatrzymania licznika.

- ID: US-009
- Tytuł: Przeglądanie dziennego podsumowania
- Opis: Jako użytkownik, chcę widzieć dzienne podsumowanie mojej pracy, aby móc ocenić swoją produktywność w danym dniu.
- Kryteria akceptacji:
  - Aplikacja domyślnie wyświetla podsumowanie dla bieżącego dnia.
  - Podsumowanie zawiera listę zadań, nad którymi pracowano danego dnia, wraz z sumą czasu poświęconego na każde z nich.
  - Na widoku podsumowania wyraźnie widoczna jest łączna liczba przepracowanych godzin i minut we wszystkich zadaniach w danym dniu.

- ID: US-010
- Tytuł: Nawigacja po historii pracy
- Opis: Jako użytkownik, chcę mieć możliwość przeglądania podsumowań z poprzednich dni, aby analizować swoją historię pracy.
- Kryteria akceptacji:
  - W interfejsie dostępny jest widok kalendarza.
  - Użytkownik może przełączać się między miesiącami.
  - Kliknięcie na konkretny dzień w kalendarzu powoduje wyświetlenie modala z podsumowaniem pracy dla tego dnia.

- ID: US-011
- Tytuł: Obsługa aktywnego licznika po ponownym otwarciu aplikacji
- Opis: Jako użytkownik, który zamknął aplikację z włączonym licznikiem, chcę po jej ponownym uruchomieniu otrzymać możliwość zdecydowania, co zrobić z naliczonym czasem.
- Kryteria akceptacji:
  - Przy starcie aplikacja sprawdza, czy któreś zadanie miało aktywny licznik w momencie ostatniego zamknięcia.
  - Jeśli tak, wyświetlany jest komunikat z trzema opcjami: "Zatrzymaj i zapisz cały czas", "Zatrzymaj i odrzuć czas od zamknięcia aplikacji", "Zatrzymaj i ręcznie skoryguj czas".
  - Wybór opcji powoduje wykonanie odpowiedniej akcji i aktualizację wpisów czasowych.

## 6. Metryki sukcesu
- MS-01: Aktywność użytkowników: 
  - 75% użytkowników rejestruje czas pracy (uruchamia i zatrzymuje licznik) minimum cztery razy w ciągu tygodnia.
- MS-02: Angażowanie w tworzenie zadań:
  - 70% użytkowników tworzy minimum jedno nowe zadanie w ciągu tygodnia.
