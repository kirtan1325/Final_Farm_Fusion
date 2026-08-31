"""
Farm Fusion Multi-Language Translation Utility
================================================
Converts non-English inputs to English before model prediction,
and translates model prediction output back to the user's selected language.
"""

import re

LANG_MAP = {
    "hi": "hi", "hi-in": "hi", "hindi": "hi", "हिंदी": "hi",
    "pa": "pa", "pa-in": "pa", "punjabi": "pa", "ਪੰਜਾਬੀ": "pa",
    "mr": "mr", "mr-in": "mr", "marathi": "mr", "मराठी": "mr",
    "gu": "gu", "gu-in": "gu", "gujarati": "gu", "ગુજરાતી": "gu",
    "ta": "ta", "ta-in": "ta", "tamil": "ta", "தமிழ்": "ta",
    "te": "te", "te-in": "te", "telugu": "te", "తెలుగు": "te",
    "kn": "kn", "kn-in": "kn", "kannada": "kn", "கன்னட": "kn",
    "ml": "ml", "ml-in": "ml", "malayalam": "ml", "മലയാളം": "ml",
    "bn": "bn", "bn-in": "bn", "bengali": "bn", "বাংলা": "bn",
    "or": "or", "or-in": "or", "odia": "or", "ଓଡ଼ିଆ": "or",
    "ur": "ur", "ur-in": "ur", "urdu": "ur", "اردو": "ur", "उर्दू": "ur",
    "es": "es", "spanish": "es", "español": "es",
    "fr": "fr", "french": "fr", "français": "fr",
    "de": "de", "german": "de", "deutsch": "de",
    "zh": "zh-CN", "zh-cn": "zh-CN", "chinese": "zh-CN",
    "ar": "ar", "arabic": "ar"
}

def normalize_lang(lang):
    if not lang:
        return "en"
    l = str(lang).strip().lower()
    return LANG_MAP.get(l, l.split("-")[0] if "-" in l else l)

def is_english(text):
    if not text:
        return True
    # ASCII strings are treated as English
    return all(ord(char) < 128 for char in str(text))

def translate_text(text, target_lang="en", source_lang="auto"):
    """
    Translates text to target_lang using mtranslate / deep_translator.
    """
    if not text or not str(text).strip():
        return text

    text_str = str(text).strip()
    target_code = normalize_lang(target_lang)
    source_code = normalize_lang(source_lang) if source_lang != "auto" else "auto"

    # If target is English and input is already ASCII English, return as-is
    if target_code == "en" and is_english(text_str):
        return text_str

    if target_code == source_code:
        return text_str

    # Attempt 1: mtranslate (fastest, lightweight)
    try:
        import mtranslate
        res = mtranslate.translate(text_str, target_code, source_code)
        if res and res.strip():
            return res.strip()
    except Exception as e1:
        pass

    # Attempt 2: deep_translator
    try:
        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source=source_code, target=target_code)
        res = translator.translate(text_str)
        if res and res.strip():
            return res.strip()
    except Exception as e2:
        pass

    return text_str

def input_to_english(text, lang_hint="auto"):
    """Translates user input to English for model processing."""
    if not text or is_english(text):
        return text
    return translate_text(text, target_lang="en", source_lang=lang_hint)

def output_from_english(text, target_lang="en"):
    """Translates model output from English to user's language."""
    target_code = normalize_lang(target_lang)
    if target_code == "en" or not text:
        return text
    return translate_text(text, target_lang=target_code, source_lang="en")

def translate_dict(data_dict, target_lang="en", keys_to_translate=None):
    """
    Translates specific text fields in a response dictionary to target_lang.
    """
    target_code = normalize_lang(target_lang)
    if target_code == "en" or not isinstance(data_dict, dict):
        return data_dict

    translated = dict(data_dict)
    for k, v in data_dict.items():
        if keys_to_translate and k not in keys_to_translate:
            continue
        if isinstance(v, str) and v.strip() and not v.strip().replace(".", "").isdigit():
            translated[k] = translate_text(v, target_lang=target_code, source_lang="en")
        elif isinstance(v, list):
            new_list = []
            for item in v:
                if isinstance(item, dict):
                    new_list.append(translate_dict(item, target_lang=target_code, keys_to_translate=keys_to_translate))
                elif isinstance(item, str):
                    new_list.append(translate_text(item, target_lang=target_code, source_lang="en"))
                else:
                    new_list.append(item)
            translated[k] = new_list
    return translated
