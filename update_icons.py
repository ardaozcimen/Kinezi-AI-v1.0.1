import re

path = '/Users/onurardaozcimen/Desktop/Kinezi-AI-v1.0/kinezi-ai/src/constants/exercises.ts'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the block of 49 exercises where icon: '🔥' is.
# I'll find all the newly added ones from the bottom of the file.

# A dictionary of new icons for specific categories
icons_map = {
    'leg_press': '🦵', 'bulgarian_split_squat': '🦵', 'rdl': '🦵', 'leg_extension': '🦵', 'lying_leg_curl': '🦵',
    'seated_leg_curl': '🦵', 'standing_calf_raise': '🦵', 'seated_calf_raise': '🦵', 'hip_thrust': '🍑', 
    'goblet_squat': '🦵', 'hack_squat': '🦵', 'sumo_deadlift': '🏋️', 'front_squat': '🏋️',
    
    'chin_up': '🦍', 'dumbbell_row': '🚣', 'pendlay_row': '🚣', 'straight_arm_pulldown': '🦍', 'shrugs': '🦍',
    'good_morning': '🦵', 'hyperextension': '🧱',
    
    'decline_bench_press': '🏋️', 'pec_deck': '🛡️', 'dumbbell_pullover': '🛡️', 'incline_dumbbell_fly': '🛡️', 'machine_chest_press': '🛡️',
    
    'arnold_press': '🏋️', 'seated_dumbbell_press': '🏋️', 'cable_lateral_raise': '🏋️', 'front_dumbbell_raise': '🏋️',
    'military_press': '🏋️', 'rear_delt_fly': '🦅',
    
    'spider_curl': '💪', 'ez_bar_curl': '💪', 'cable_curl': '💪', 'reverse_curl': '💪', 'rope_pushdown': '💪',
    'overhead_dumbbell_extension': '💪', 'tricep_kickback': '💪', 'bench_dips': '💪',
    
    'russian_twist': '🧱', 'leg_raises': '🧱', 'bicycle_crunches': '🧱', 'mountain_climbers': '🏃', 'ab_roller': '🧱',
    'hanging_leg_raise': '🧱', 'v_ups': '🧱', 'flutter_kicks': '🧱',
    
    'burpees': '🥵', 'kettlebell_swing': '🏃'
}

# The added items have format:
#   {
#     id: 'leg_press',
#     name: 'Leg Press',
# ...
#     icon: '🔥',
# ...
#   },

def replace_icon(match):
    full_block = match.group(0)
    id_val = match.group(1)
    new_icon = icons_map.get(id_val, '🔥')
    
    # replace icon: '🔥' with icon: 'new_icon', \n    demoUrl: ''
    # wait, the original didn't have demoUrl for the new ones. I will insert demoUrl right after tipsTr.
    
    # First, replace the icon
    full_block = re.sub(r"icon:\s*'🔥'", f"icon: '{new_icon}'", full_block)
    
    # Second, add demoUrl: '' if not exists
    if 'demoUrl' not in full_block:
        full_block = re.sub(r"(tipsTr:\s*\[.*?\])(,?)", r"\1,\n    demoUrl: ''", full_block)
        
    return full_block

# Regex to match each exercise block
# It matches from 'id: '...' to the end of the object '}'
pattern = re.compile(r"\{\s*id:\s*'([a-z0-9_]+)'.*?tipsTr:\s*\[.*?\].*?\}", re.DOTALL)

new_content = pattern.sub(replace_icon, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Icons and demoUrls updated!")
