alter table public."Device"
  drop constraint if exists "Device_platform_check";

alter table public."Device"
  add constraint "Device_platform_check"
  check (
    platform in ('android', 'ios', 'web', 'windows', 'macos', 'linux', 'electron')
  );
