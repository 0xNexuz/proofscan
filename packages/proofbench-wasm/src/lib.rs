#![no_std]

use core::panic::PanicInfo;

#[panic_handler]
fn panic(_: &PanicInfo) -> ! { core::arch::wasm32::unreachable() }

const HEAP_SIZE: usize = 4 * 1024 * 1024;
static mut HEAP: [u8; HEAP_SIZE] = [0; HEAP_SIZE];
static mut OFFSET: usize = 0;

#[unsafe(no_mangle)]
pub unsafe extern "C" fn alloc(size: i32) -> i32 {
    let size = size.max(0) as usize;
    unsafe {
        let aligned = (OFFSET + 7) & !7;
        if aligned + size > HEAP_SIZE { OFFSET = 0; } else { OFFSET = aligned; }
        let ptr = core::ptr::addr_of_mut!(HEAP).cast::<u8>().add(OFFSET);
        OFFSET += size;
        ptr as i32
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn dealloc(_: i32, _: i32) {}

unsafe fn input<'a>(ptr: i32, len: i32) -> &'a [u8] {
    unsafe { core::slice::from_raw_parts(ptr as *const u8, len.max(0) as usize) }
}
fn blank(value: &[u8]) -> bool { value.iter().all(|b| b.is_ascii_whitespace()) }
fn find(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    if needle.is_empty() { return Some(0); }
    haystack.windows(needle.len()).position(|window| window == needle)
}
fn json_string<'a>(json: &'a [u8], key: &[u8]) -> Option<&'a [u8]> {
    let start = find(json, key)? + key.len();
    let rest = &json[start..]; let quote = rest.iter().position(|b| *b == b'"')?;
    let value = &rest[quote + 1..]; let mut escaped = false;
    for (i, byte) in value.iter().enumerate() {
        if *byte == b'"' && !escaped { return Some(&value[..i]); }
        escaped = *byte == b'\\' && !escaped;
        if *byte != b'\\' { escaped = false; }
    }
    None
}
fn json_number(json: &[u8], key: &[u8]) -> Option<f32> {
    let start = find(json, key)? + key.len(); let mut value = 0.0; let mut decimal = 0.0; let mut seen = false;
    for byte in &json[start..] {
        if byte.is_ascii_digit() { seen = true; let digit = (byte - b'0') as f32; if decimal == 0.0 { value = value * 10.0 + digit; } else { value += digit * decimal; decimal *= 0.1; } }
        else if *byte == b'.' && seen { decimal = 0.1; }
        else if seen { break; }
    }
    if seen { Some(value) } else { None }
}
fn eq(a: Option<&[u8]>, b: Option<&[u8]>) -> bool { matches!((a,b),(Some(x),Some(y)) if x == y) }
fn contains(haystack: &[u8], needle: Option<&[u8]>) -> bool { needle.is_some_and(|n| !n.is_empty() && find(haystack,n).is_some()) }

#[unsafe(no_mangle)]
pub unsafe extern "C" fn rank_answer(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->f32 {
    let (question, ground_truth, answer) = unsafe { (input(q_ptr,q_len), input(gt_ptr,gt_len), input(ma_ptr,ma_len)) };
    if blank(answer) || !contains(answer, Some(b"verdict")) { return 0.0; }
    let expected = json_string(ground_truth,b"\"verdict\""); let predicted = json_string(answer,b"\"verdict\"");
    if expected.is_none() || predicted.is_none() { return 0.0; }
    let correct = eq(expected,predicted); let confidence = json_number(answer,b"\"confidence\"").unwrap_or(0.0).clamp(0.0,1.0);
    let target = if correct { 1.0 } else { 0.0 }; let calibration = 1.0 - (confidence-target)*(confidence-target);
    let decisive = expected == Some(b"SUPPORTED") || expected == Some(b"CONTRADICTED");
    let span = json_string(answer,b"\"evidenceSpan\"");
    let evidence = if decisive { if contains(ground_truth,span) && contains(question,span) { 1.0 } else { 0.0 } } else if span.is_none() { 1.0 } else { 0.0 };
    let source = json_string(answer,b"\"source\""); let citation = if source.is_some() && contains(ground_truth,source) { 1.0 } else if !decisive { 1.0 } else { 0.0 };
    let mut score = (if correct {0.55}else{0.0}) + 0.15*calibration + 0.20*evidence + 0.10*citation;
    if predicted == Some(b"SUPPORTED") && expected != Some(b"SUPPORTED") { score = score.min(0.05); }
    if predicted == Some(b"CONTRADICTED") && expected != Some(b"CONTRADICTED") { score = score.min(0.20); }
    if span.is_some() && !contains(question,span) { score = score.min(0.25); }
    score.clamp(0.0,1.0)
}
